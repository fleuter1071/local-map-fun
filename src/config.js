export const categories = [
  { id: "park", label: "Parks", desc: "Parks and green spaces", tags: ["leisure=park", "landuse=recreation_ground"] },
  { id: "coffee", label: "Coffee", desc: "Cafes and coffee shops", tags: ["amenity=cafe", "shop=coffee"] },
  { id: "restaurant", label: "Restaurants", desc: "Sit-down food nearby", tags: ["amenity=restaurant"] },
  { id: "pharmacy", label: "Drug stores", desc: "Pharmacies and drug stores", tags: ["amenity=pharmacy"] },
  { id: "bakery", label: "Bakeries", desc: "Bread, pastries, sweets", tags: ["shop=bakery"] },
  { id: "grocery", label: "Groceries", desc: "Markets and grocery stores", tags: ["shop=supermarket", "shop=convenience", "shop=grocery"] },
  { id: "playground", label: "Playgrounds", desc: "Play areas and kid spots", tags: ["leisure=playground"] },
  { id: "gym", label: "Gyms", desc: "Fitness and training", tags: ["leisure=fitness_centre", "sport=fitness"] }
];

export const quickCategoryIds = ["park", "coffee", "restaurant", "pharmacy"];
export const defaultCenter = [40.876, -73.910];
export const defaultZoom = 14;
export const searchRadiusMeters = 1300;

export function getCategoryById(categoryId) {
  return categories.find((category) => category.id === categoryId) || null;
}
