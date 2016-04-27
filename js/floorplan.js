'use strict';

import _ from 'lodash';
import THREE from 'three';

export function createModel (floorplan) {
  var completedFloorplan = completeFloorplan(floorplan);
  var lines = getLineModels(completedFloorplan);
  var points = getPointModel(completedFloorplan.points);

  return {lines, points};
}

function getLineModels ({lines, points}) {
  return _.map(lines, ({from, to}) => {
    var material = new THREE.LineBasicMaterial({
      color: 0xff00ff
    });

    var geometry = new THREE.Geometry();
    geometry.vertices = [
      new THREE.Vector3(points[from].x, points[from].y, 0),
      new THREE.Vector3(points[to].x, points[to].y, 0)
    ];

    return new THREE.Line(geometry, material);
  });
}

function getPointModel (points) {
  return _.map(points, ({x, y}, id) => {
    var geometry = new THREE.BoxGeometry(20, 20, 20);
    var material = new THREE.MeshBasicMaterial({color: 0x00ff00});
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = x;
    mesh.position.y = y;
    mesh.data = {id};

    return mesh;
  });
}

function completeFloorplan (floorplan) {
  var endPoint;
  var {points, lines} = floorplan;
  var pointsWithLines = _.map(points, (point) => _.assign({}, point, {lines: getConnectedLines(lines, point.id)}));
  var endPoints = _.filter(pointsWithLines, (point) => point.lines.length === 1);

  while (endPoint = endPoints.pop()) {
    let nearestPoint = getNearestPoint(endPoint, endPoints);

    let {from, to} = endPoint.lines[0];
    let fromPoint = points[from];
    let toPoint = points[to];
    let pointId = points.length;

    let newPoint = (Math.abs(fromPoint.x - toPoint.x) > Math.abs(fromPoint.y - toPoint.y)) ?
    { id: pointId,
      x: nearestPoint.x,
      y: endPoint.y }
      :
    { id: pointId,
      x: endPoint.x,
      y: nearestPoint.y };

    floorplan.lines.push({from: nearestPoint.id, to: pointId});
    floorplan.lines.push({from: endPoint.id, to: pointId});
    floorplan.points.push(newPoint);

    endPoints = _.reject(endPoints, ({id}) => id == nearestPoint.id);
  }

  return floorplan;
}

function getConnectedLines (lines, id) {
  return _.filter(lines, ({from, to}) => (from === id || to === id));
}

function getNearestPoint (point, points) {
  return _.reduce(points,
    ({min, nearestPoint}, comparePoint) => {
      var distance = Math.pow(point.x - comparePoint.x, 2) + Math.pow(point.y - comparePoint.y, 2);
      return distance < min ? {min: distance, nearestPoint: comparePoint} : {min, nearestPoint}
    },
    {
      min: Infinity,
      nearestPoint: null
    }
  ).nearestPoint;
}