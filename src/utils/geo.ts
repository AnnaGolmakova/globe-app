import * as THREE from "three/webgpu"

/**
 * Converts longitude/latitude (degrees) to a THREE.Vector3 on a sphere of given radius.
 */
export function lngLatToVec3(lng: number, lat: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)   // polar angle from Y axis
  const theta = (lng + 180) * (Math.PI / 180) // azimuthal angle

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta),
  )
}

/**
 * Computes the average position (centroid) of an array of Vector3 points.
 */
export function centroid(points: THREE.Vector3[]): THREE.Vector3 {
  const sum = new THREE.Vector3()
  for (const p of points) sum.add(p)
  return sum.divideScalar(points.length)
}
