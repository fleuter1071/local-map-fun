export async function requestCurrentPosition({ initial = false } = {}) {
  if (!navigator.geolocation) {
    throw new Error("Geolocation is unavailable");
  }

  const options = initial
    ? { enableHighAccuracy: false, timeout: 4000, maximumAge: 300000 }
    : { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 };

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}
