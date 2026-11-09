import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🍽️ Starting Menu and Tables Seeding...');

  // 1. Find the Restaurant & Branch
  const restaurant = await prisma.restaurant.findFirst({
    where: { name: 'Demo Restaurant' },
  });
  if (!restaurant) {
    throw new Error('Restaurant not found! Please run the main seed script first.');
  }

  const branch = await prisma.branch.findFirst({
    where: { restaurantId: restaurant.id },
  });
  if (!branch) {
    throw new Error('Branch not found!');
  }

  console.log(`Using Restaurant: ${restaurant.name} (${restaurant.id})`);
  console.log(`Using Branch: ${branch.name} (${branch.id})`);

  // 2. Create Tables T1 to T10
  console.log('\nCreating Dining Tables...');
  const tablesData = [
    { number: 'T1', capacity: 2 },
    { number: 'T2', capacity: 2 },
    { number: 'T3', capacity: 4 },
    { number: 'T4', capacity: 4 },
    { number: 'T5', capacity: 4 },
    { number: 'T6', capacity: 6 },
    { number: 'T7', capacity: 6 },
    { number: 'T8', capacity: 8 },
    { number: 'T9', capacity: 4 },
    { number: 'T10', capacity: 4 },
  ];

  for (const t of tablesData) {
    const existing = await prisma.table.findFirst({
      where: { branchId: branch.id, number: t.number },
    });
    if (!existing) {
      await prisma.table.create({
        data: {
          number: t.number,
          capacity: t.capacity,
          branchId: branch.id,
          status: 'AVAILABLE',
          qrCodeData: `TBL-${branch.code}-${t.number}`,
        },
      });
      console.log(`✅ Created Table ${t.number} (Cap: ${t.capacity})`);
    } else {
      console.log(`⏭️ Table ${t.number} already exists`);
    }
  }

  // 3. Create Categories
  console.log('\nCreating Menu Categories...');
  const categoriesData = [
    {
      name: 'Traditional Specialties',
      description: 'Authentic Ethiopian recipes prepared with seasoned butter and organic spices',
      sortOrder: 1,
    },
    {
      name: 'Grill & Steaks',
      description: 'Flame-grilled prime cuts and succulent skewered meats',
      sortOrder: 2,
    },
    {
      name: 'Burgers & Sandwiches',
      description: 'Juicy gourmet burgers and toasted sandwiches served with golden fries',
      sortOrder: 3,
    },
    {
      name: 'Pasta & Pizza',
      description: 'Handcrafted Italian pasta dishes and stone-baked artisanal pizzas',
      sortOrder: 4,
    },
    {
      name: 'Appetizers & Starters',
      description: 'Crispy sambusas, savory finger bites, and fresh garden salads',
      sortOrder: 5,
    },
    {
      name: 'Beverages & Coffee',
      description: 'Traditional organic jebena coffee, fresh fruit juices, and cold drinks',
      sortOrder: 6,
    },
    {
      name: 'Desserts',
      description: 'Indulgent sweet treats, creamy cheesecakes, and chocolate delights',
      sortOrder: 7,
    },
  ];

  const categoryMap = new Map<string, string>();

  for (const cat of categoriesData) {
    let existing = await prisma.menuCategory.findFirst({
      where: { restaurantId: restaurant.id, name: cat.name },
    });
    if (!existing) {
      existing = await prisma.menuCategory.create({
        data: {
          name: cat.name,
          description: cat.description,
          sortOrder: cat.sortOrder,
          restaurantId: restaurant.id,
          isActive: true,
        },
      });
      console.log(`✅ Created Category: ${cat.name}`);
    } else {
      console.log(`⏭️ Category already exists: ${cat.name}`);
    }
    categoryMap.set(cat.name, existing.id);
  }

  // 4. Create Menu Items
  console.log('\nCreating Menu Items...');
  const menuItems = [
    // Traditional Specialties
    {
      category: 'Traditional Specialties',
      name: 'Special Derek Tibs',
      description: 'Tender beef cubes sautéed with onions, rosemary, jalapeño, and Ethiopian spiced butter (kibbeh), served sizzling with fresh injera.',
      price: 650,
      preparationTime: 20,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
      isSpicy: true,
      isVegetarian: false,
    },
    {
      category: 'Traditional Specialties',
      name: 'Doro Wat',
      description: 'Slow-simmered traditional spicy chicken stew infused with authentic berbere, served with a hard-boiled egg and injera.',
      price: 750,
      preparationTime: 25,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
      isSpicy: true,
      isVegetarian: false,
    },
    {
      category: 'Traditional Specialties',
      name: 'Kitfo Special',
      description: 'Minced prime lean beef seasoned with fiery mitmita chili and herb-infused clarified butter, accompanied by ayib cottage cheese and collard greens.',
      price: 850,
      preparationTime: 15,
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80',
      isSpicy: true,
      isVegetarian: false,
    },
    {
      category: 'Traditional Specialties',
      name: 'Shiro Tegabino',
      description: 'Creamy sun-dried chickpea flour stew simmered with garlic and onions, served bubbling hot in a clay pot with warm injera.',
      price: 350,
      preparationTime: 15,
      image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80',
      isSpicy: false,
      isVegetarian: true,
    },
    {
      category: 'Traditional Specialties',
      name: 'Beyaynetu (Veggie Combo)',
      description: 'Colorful vegan feast consisting of yellow split peas, red lentils, collard greens, beetroot, and cabbage over injera.',
      price: 450,
      preparationTime: 15,
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80',
      isSpicy: false,
      isVegetarian: true,
    },
    {
      category: 'Traditional Specialties',
      name: 'Tire Sega Cut',
      description: 'Freshly cut tender raw beef cubes served with senafich mustard and spicy awaze dipping paste.',
      price: 950,
      preparationTime: 10,
      image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=800&auto=format&fit=crop&q=80',
      isSpicy: true,
      isVegetarian: false,
    },

    // Grill & Steaks
    {
      category: 'Grill & Steaks',
      name: 'Prime Grilled Ribeye Steak',
      description: 'Char-grilled prime beef steak served with rosemary garlic butter, seasoned wedges, and roasted seasonal vegetables.',
      price: 1200,
      preparationTime: 25,
      image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=800&auto=format&fit=crop&q=80',
      isSpicy: false,
      isVegetarian: false,
    },
    {
      category: 'Grill & Steaks',
      name: 'Herb Grilled Chicken Breast',
      description: 'Marinated tender chicken breast grilled to perfection, served with garlic herb glaze and fragrant butter rice.',
      price: 680,
      preparationTime: 20,
      image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&auto=format&fit=crop&q=80',
      isSpicy: false,
      isVegetarian: false,
    },
    {
      category: 'Grill & Steaks',
      name: 'Mixed BBQ Platter',
      description: 'Generous sharing platter with lamb skewers, BBQ chicken wings, and grilled beef sausage with assorted dips.',
      price: 1450,
      preparationTime: 30,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
      isSpicy: false,
      isVegetarian: false,
    },

    // Burgers & Sandwiches
    {
      category: 'Burgers & Sandwiches',
      name: 'Double Gourmet Cheeseburger',
      description: 'Two 100% prime beef patties, melted aged cheddar, caramelized onions, crisp pickles, and secret house sauce on brioche bun with fries.',
      price: 480,
      preparationTime: 15,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
      isSpicy: false,
      isVegetarian: false,
    },
    {
      category: 'Burgers & Sandwiches',
      name: 'Crispy Chicken Zinger Burger',
      description: 'Crispy southern-fried chicken breast, spicy sriracha mayo, iceberg lettuce, and cheese on a toasted bun with crunchy fries.',
      price: 450,
      preparationTime: 15,
      image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=800&auto=format&fit=crop&q=80',
      isSpicy: true,
      isVegetarian: false,
    },
    {
      category: 'Burgers & Sandwiches',
      name: 'Classic Club Sandwich',
      description: 'Triple-decker toasted sandwich layered with grilled chicken, crispy beef bacon, fried egg, lettuce, and sliced tomatoes.',
      price: 390,
      preparationTime: 15,
      image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80',
      isSpicy: false,
      isVegetarian: false,
    },

    // Pasta & Pizza
    {
      category: 'Pasta & Pizza',
      name: 'Margherita Woodfired Pizza',
      description: 'Crispy stone-baked crust topped with Italian plum tomato sauce, buffalo mozzarella, and fresh sweet basil.',
      price: 520,
      preparationTime: 18,
      image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&auto=format&fit=crop&q=80',
      isSpicy: false,
      isVegetarian: true,
    },
    {
      category: 'Pasta & Pizza',
      name: 'Spaghetti Bolognese',
      description: 'Traditional al dente spaghetti served with slow-cooked minced beef ragu, oregano, and shaved aged parmesan.',
      price: 490,
      preparationTime: 18,
      image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281781?w=800&auto=format&fit=crop&q=80',
      isSpicy: false,
      isVegetarian: false,
    },
    {
      category: 'Pasta & Pizza',
      name: 'Creamy Chicken Alfredo Penne',
      description: 'Tender penne pasta tossed in a rich parmesan cream sauce with sautéed mushrooms and grilled chicken strips.',
      price: 580,
      preparationTime: 20,
      image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=800&auto=format&fit=crop&q=80',
      isSpicy: false,
      isVegetarian: false,
    },

    // Appetizers & Starters
    {
      category: 'Appetizers & Starters',
      name: 'Crispy Beef Sambusa (4 pcs)',
      description: 'Flaky golden pastry triangles filled with seasoned minced beef, green peppers, and aromatic herbs, served with sweet chili sauce.',
      price: 180,
      preparationTime: 10,
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
      isSpicy: false,
      isVegetarian: false,
    },
    {
      category: 'Appetizers & Starters',
      name: 'Lentil Veggie Sambusa (4 pcs)',
      description: 'Crispy vegetarian sambusas packed with spiced whole brown lentils, onions, and garlic.',
      price: 150,
      preparationTime: 10,
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
      isSpicy: false,
      isVegetarian: true,
    },
    {
      category: 'Appetizers & Starters',
      name: 'Fresh Caesar Salad',
      description: 'Crisp romaine lettuce tossed in creamy Caesar dressing with garlic croutons and shaved parmesan cheese.',
      price: 320,
      preparationTime: 10,
      image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&auto=format&fit=crop&q=80',
      isSpicy: false,
      isVegetarian: true,
    },

    // Beverages & Coffee
    {
      category: 'Beverages & Coffee',
      name: 'Traditional Clay-Pot Buna (Coffee)',
      description: 'Freshly roasted Ethiopian highland coffee brewed in a traditional black clay jebena, served with smoking frankincense and popcorn.',
      price: 120,
      preparationTime: 12,
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
      isSpicy: false,
      isVegetarian: true,
    },
    {
      category: 'Beverages & Coffee',
      name: 'Fresh Layered Mango & Avocado Juice',
      description: 'Thick, creamy layers of fresh pureed avocado and sweet tropical mango, served with a lime wedge and sweet syrup.',
      price: 220,
      preparationTime: 8,
      image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=800&auto=format&fit=crop&q=80',
      isSpicy: false,
      isVegetarian: true,
    },
    {
      category: 'Beverages & Coffee',
      name: 'Chilled Sparkling Lemon Mint',
      description: 'Refreshing blend of freshly squeezed lemon juice, crushed mint leaves, and effervescent sparkling soda over ice.',
      price: 160,
      preparationTime: 5,
      image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
      isSpicy: false,
      isVegetarian: true,
    },

    // Desserts
    {
      category: 'Desserts',
      name: 'New York Style Cheesecake',
      description: 'Velvety smooth baked cream cheesecake with a buttery graham cracker crust, topped with fresh raspberry glaze.',
      price: 340,
      preparationTime: 5,
      image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&auto=format&fit=crop&q=80',
      isSpicy: false,
      isVegetarian: true,
    },
    {
      category: 'Desserts',
      name: 'Molten Chocolate Lava Cake',
      description: 'Warm, decadent Belgian dark chocolate cake with a molten liquid fudge center, served with vanilla bean ice cream.',
      price: 380,
      preparationTime: 12,
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80',
      isSpicy: false,
      isVegetarian: true,
    },
  ];

  let displayOrder = 1;
  for (const item of menuItems) {
    const categoryId = categoryMap.get(item.category);
    if (!categoryId) continue;

    const existing = await prisma.menuItem.findFirst({
      where: { categoryId, name: item.name },
    });

    if (!existing) {
      await prisma.menuItem.create({
        data: {
          name: item.name,
          description: item.description,
          price: item.price,
          preparationTime: item.preparationTime,
          image: item.image,
          categoryId,
          isAvailable: true,
          isVegetarian: item.isVegetarian,
          isSpicy: item.isSpicy,
          displayOrder: displayOrder++,
        },
      });
      console.log(`✅ Created Dish: ${item.name} (${item.price} ETB)`);
    } else {
      console.log(`⏭️ Dish already exists: ${item.name}`);
    }
  }

  console.log('\n🎉 Menu and Tables Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding menu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

