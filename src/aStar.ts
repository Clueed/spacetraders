import { Waypoint } from "./types/Waypoint.js";

interface DistanceMap {
  [key: string]: number;
}

export function getDistance(source: Waypoint, destination: Waypoint): number {
  // Calculate and return the distance between two waypoints
  // You need to implement this function according to your requirements
  return 0;
}

function findShortestPath(waypoints: Waypoint[]): Waypoint[] {
  const numWaypoints = waypoints.length;

  // Initialize variables
  let shortestPath: Waypoint[] = [];
  let shortestDistance = Infinity;

  // Helper function to calculate the total distance of a given path
  function calculatePathDistance(path: Waypoint[]): number {
    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      totalDistance += getDistance(path[i], path[i + 1]);
    }
    return totalDistance;
  }

  // Helper function to find all permutations of a given array
  function permute(array: Waypoint[], start: number): void {
    if (start === numWaypoints - 1) {
      // Calculate distance for the current path
      const distance = calculatePathDistance(array);

      // Update the shortest path if the current distance is smaller
      if (distance < shortestDistance) {
        shortestPath = array.slice(); // Create a copy of the array
        shortestDistance = distance;
      }
    } else {
      for (let i = start; i < numWaypoints; i++) {
        // Swap elements at indices start and i
        [array[start], array[i]] = [array[i], array[start]];

        // Recursively find permutations
        permute(array, start + 1);

        // Restore the original order
        [array[start], array[i]] = [array[i], array[start]];
      }
    }
  }

  // Start the permutation process
  permute(waypoints, 0);

  return shortestPath;
}

const shortestPath = findShortestPath(waypoints);
console.log(shortestPath);
