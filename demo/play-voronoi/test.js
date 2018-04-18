function crossMul(P, Q) {
    return P.x * Q.y - P.y * Q.x;
};

function checkCross(P1, P2, Q1, Q2) {
    if (Math.min(P1.x, P2.x) <= Math.max(Q1.x, Q2.x) &&
        Math.min(Q1.x, Q2.x) <= Math.max(P1.x, P2.x) &&
        Math.min(P1.y, P2.y) <= Math.max(Q1.y, Q2.y) &&
        Math.min(Q1.y, Q2.y) <= Math.max(P1.y, P2.y)) {
        Q1P1 = {
            x: Q1.x - P1.x,
            y: Q1.y - P1.y
        };
        Q1Q2 = {
            x: Q1.x - Q2.x,
            y: Q1.y - Q2.y
        };
        Q1P2 = {
            x: Q1.x - P2.x,
            y: Q1.y - P2.y
        };
        P1Q1 = {
            x: P1.x - Q1.x,
            y: P1.y - Q1.y
        };
        P1P2 = {
            x: P1.x - P2.x,
            y: P1.y - P2.y
        };
        P1Q2 = {
            x: P1.x - Q2.x,
            y: P1.y - Q2.y
        };
        if (crossMul(Q1P1, Q1Q2) * crossMul(Q1P2, Q1Q2) < 0 &&
            crossMul(P1Q1, P1P2) * crossMul(P1Q2, P1P2) < 0) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};

function canvasClick(e) {
    // 取得画布上被单击的点
    var clickX = e.pageX - Demo.canvas.offsetLeft;
    var clickY = e.pageY - Demo.canvas.offsetTop;

    // 查找被单击的圆圈
    for (var i = Demo.sites.length - 1; i >= 0; i--) {
        var site = Demo.sites[i];
        //使用勾股定理计算这个点与圆心之间的距离
        var distanceFromCenter = Math.sqrt(Math.pow(site.x - clickX, 2) + Math.pow(site.y - clickY, 2));
        if (distanceFromCenter <= Demo.siteRadio) {
            Demo.selectSiteId = i;
            Demo.isDragging = true;
            Demo.compute(Demo.sites);
            return;
        }
    }
};

function dragSites(e) {
    if (Demo.isDragging) {
        if (Demo.selectSiteId >= 0) {
            var x = e.pageX - Demo.canvas.offsetLeft;
            var y = e.pageY - Demo.canvas.offsetTop;
            Demo.sites[Demo.selectSiteId].x = x;
            Demo.sites[Demo.selectSiteId].y = y;
            Demo.compute(Demo.sites);
        }
    }
};

function stopDragging() {
    Demo.isDragging = false;
}

var Demo = {
    voronoi: new Voronoi(),
    sites: [],
    diagram: null,
    margin: 0.15,
    canvas: null,
    bbox: {
        xl: 0,
        xr: 1024,
        yt: 0,
        yb: 1024
    },
    cc: {
        x: 512,
        y: 512
    },
    radio: 512,
    siteRadio: 5,
    selectSiteId: -1,
    isDragging: false,
    init: function() {
        this.canvas = document.getElementById('voronoiCanvas');
        this.canvas.onmousedown = canvasClick;
        this.canvas.onmouseup = stopDragging;
        this.canvas.onmouseout = stopDragging;
        this.canvas.onmousemove = dragSites;
    },
    clearSites: function() {
        this.sites = [];
    },
    compute: function(sites) {
        this.sites = sites;
        this.voronoi.recycle(this.diagram);
        this.diagram = this.voronoi.compute(sites, this.bbox);
        this.render();
    },
    randomSites: function(n, clear) {
        if (clear) {
            this.sites = [];
        }
        for (var i = 0; i < n; i++) {
            do {
                x = Math.random() - 0.5;
                y = Math.random() - 0.5;
            } while (x * x + y * y > 0.25);
            x = (x * 0.96875 + 0.5) * this.canvas.width;
            y = (y * 0.96875 + 0.5) * this.canvas.height;
            this.sites.push({
                x: x,
                y: y
            });
        }
        this.diagram = this.voronoi.compute(this.sites, this.bbox);
    },
    render: function() {
        var ctx = this.canvas.getContext('2d');
        // background
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.rect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = '#888';
        ctx.stroke();

        // voronoi
        if (!this.diagram) {
            return;
        }

        // sites
        var sites = this.sites,
            iSite = sites.length;
        while (iSite--) {
            v = sites[iSite];
            ctx.beginPath();
            ctx.fillStyle = '#44f';
            ctx.arc(v.x, v.y, this.siteRadio, 0, Math.PI * 2);
            ctx.fill();
        }

        // edges
        var drawEdge = document.getElementById("drawEdge");
        if (drawEdge.checked) {
            ctx.beginPath();
            ctx.strokeStyle = '#000';
            var edges = this.diagram.edges,
                iEdge = edges.length,
                edge, v;
            while (iEdge--) {
                edge = edges[iEdge];
                v = edge.va;
                ctx.moveTo(v.x, v.y);
                v = edge.vb;
                ctx.lineTo(v.x, v.y);
            }
            ctx.stroke();
            // edge intersection points
            ctx.beginPath();
            ctx.fillStyle = 'red';
            var vertices = this.diagram.vertices,
                iVertex = vertices.length;
            while (iVertex--) {
                v = vertices[iVertex];
                ctx.rect(v.x - 1, v.y - 1, 3, 3);
            }
            ctx.fill();
        }

        // paths
        var drawPath = document.getElementById("drawPath");
        if (drawPath.checked) {
            ctx.beginPath();
            ctx.strokeStyle = 'red';
            var edges = this.diagram.edges,
                iEdge = edges.length,
                edge;
            var paths = [];
            var hashMap = {
                Set: function(key, value) {
                    this[key] = value
                },
                Get: function(key) {
                    return this[key]
                },
                Contains: function(key) {
                    return this.Get(key) == null ? false : true
                },
                Remove: function(key) {
                    delete this[key]
                }
            }
            var maxPath = 4;
            while (iEdge--) {
                edge = edges[iEdge];
                if (edge.va && edge.vb && edge.lSite && edge.rSite) {
                    var lSiteDegree = hashMap.Contains(edge.lSite.voronoiId) ? hashMap.Get(edge.lSite.voronoiId) : 0;
                    var rSiteDegree = hashMap.Contains(edge.rSite.voronoiId) ? hashMap.Get(edge.rSite.voronoiId) : 0;
                    if (lSiteDegree < maxPath && rSiteDegree < maxPath) {
                        if (checkCross(edge.va, edge.vb, edge.lSite, edge.rSite)) {
                            ctx.moveTo(edge.lSite.x, edge.lSite.y);
                            ctx.lineTo(edge.rSite.x, edge.rSite.y);
                            var path = {
                                lSiteId: edge.lSite.voronoiId,
                                rSiteId: edge.rSite.voronoiId
                            };
                            paths.push(path);
                            hashMap.Set(edge.lSite.voronoiId, lSiteDegree + 1);
                            hashMap.Set(edge.rSite.voronoiId, rSiteDegree + 1);
                        }
                    }
                }
            }
            ctx.stroke();
            this.diagram.paths = paths;
        }
    },
    cellArea: function(cell) {
        var area = 0,
            halfedges = cell.halfedges,
            iHalfedge = halfedges.length,
            halfedge,
            p1, p2;
        while (iHalfedge--) {
            halfedge = halfedges[iHalfedge];
            p1 = halfedge.getStartpoint();
            p2 = halfedge.getEndpoint();
            area += p1.x * p2.y;
            area -= p1.y * p2.x;
        }
        area /= 2;
        return area;
    },
    cellCentroid: function(cell) {
        var x = 0,
            y = 0,
            halfedges = cell.halfedges,
            iHalfedge = halfedges.length,
            halfedge,
            v, p1, p2;
        while (iHalfedge--) {
            halfedge = halfedges[iHalfedge];
            p1 = halfedge.getStartpoint();
            p2 = halfedge.getEndpoint();
            v = p1.x * p2.y - p2.x * p1.y;
            x += (p1.x + p2.x) * v;
            y += (p1.y + p2.y) * v;
        }
        v = this.cellArea(cell) * 6;
        return {
            x: x / v,
            y: y / v
        };
    },
    distance: function(a, b) {
        var dx = a.x - b.x,
            dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    },
    relaxSites: function() {
        if (!this.diagram) {
            return;
        }
        var cells = this.diagram.cells,
            iCell = cells.length,
            cell,
            site, sites = [],
            again = false,
            rn, dist;
        var p = 1 / iCell * 0.1;
        while (iCell--) {
            cell = cells[iCell];
            rn = Math.random();
            // probability of apoptosis
            if (rn < p) {
                continue;
            }
            site = this.cellCentroid(cell);
            dist = this.distance(site, cell.site);
            again = again || dist > 1;
            // don't relax too fast
            if (dist > 2) {
                site.x = (site.x + cell.site.x) / 2;
                site.y = (site.y + cell.site.y) / 2;
            }
            // probability of mytosis
            if (rn > (1 - p)) {
                dist /= 2;
                var nx = site.x + (site.x - cell.site.x) / dist;
                var ny = site.y + (site.y - cell.site.y) / dist;
                if (Math.pow(nx - this.cc.y, 2) + Math.pow(ny - this.cc.y, 2) > Math.pow(this.radio, 2)) {
                    sites.push({
                        x: cell.site.x,
                        y: cell.site.y
                    })
                } else {
                    sites.push({
                        x: nx,
                        y: ny
                    });
                }
            }
            if (Math.pow(site.x - this.cc.y, 2) + Math.pow(site.y - this.cc.y, 2) > Math.pow(this.radio, 2)) {
                sites.push({
                    x: cell.site.x,
                    y: cell.site.y
                })
            } else {
                sites.push(site);
            }
        }
        this.compute(sites);
    },
    save: function() {
        var a = document.getElementById("saveData");
        var data = {
            sites: this.diagram.cells.map(function(v) {
                return v.site
            }),
            paths: this.diagram.paths
        }
        var blob = new Blob([JSON.stringify(data)], {
            type: "application/json;charset=utf-8"
        });
        a.href = URL.createObjectURL(blob);
        a.download = "saveData.js";
        a.click();
    }
};