const categories = [
  { id: "park", label: "Parks", desc: "Parks and green spaces", tags: ["leisure=park", "landuse=recreation_ground"] },
  { id: "coffee", label: "Coffee", desc: "Cafes and coffee shops", tags: ["amenity=cafe", "shop=coffee"] },
  { id: "restaurant", label: "Restaurants", desc: "Sit-down food nearby", tags: ["amenity=restaurant"] },
  { id: "pharmacy", label: "Drug stores", desc: "Pharmacies and drug stores", tags: ["amenity=pharmacy"] },
  { id: "bakery", label: "Bakeries", desc: "Bread, pastries, sweets", tags: ["shop=bakery"] },
  { id: "grocery", label: "Groceries", desc: "Markets and grocery stores", tags: ["shop=supermarket", "shop=convenience", "shop=grocery"] },
  { id: "playground", label: "Playgrounds", desc: "Play areas and kid spots", tags: ["leisure=playground"] },
  { id: "gym", label: "Gyms", desc: "Fitness and training", tags: ["leisure=fitness_centre", "sport=fitness"] }
];

const categoryAliases = new Map([
  ["cafe", "coffee"],
  ["cafes", "coffee"],
  ["coffee shop", "coffee"],
  ["coffee shops", "coffee"],
  ["drug store", "pharmacy"],
  ["drug stores", "pharmacy"],
  ["pharmacies", "pharmacy"],
  ["restaurants", "restaurant"],
  ["parks", "park"],
  ["groceries", "grocery"],
  ["grocery store", "grocery"],
  ["grocery stores", "grocery"],
  ["supermarket", "grocery"],
  ["supermarkets", "grocery"],
  ["bakeries", "bakery"],
  ["gyms", "gym"],
  ["playgrounds", "playground"]
]);

module.exports = {
  categories,
  categoryAliases
};
