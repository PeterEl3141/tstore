import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Clear old data (dev only)
  await prisma.review.deleteMany();
  await prisma.tShirt.deleteMany();

  const shirts = [
    {
      name: "Bach Tee",
      slug: "bach-tee",
      description: "Soft cotton tee featuring a minimalist Bach-inspired design.",
      priceCents: 2500,
      currency: "USD",
      images: ["/img/tshirts/bach-front.jpg", "/img/tshirts/bach-back.jpg"],
      colorOptions: ["Cream", "Black"],
      sizeOptions: ["S", "M", "L", "XL"],
      category: "ARTIST",
      reviews: {
        create: [
          { rating: 5, title: "Perfect tribute", body: "Subtle but elegant.", authorName: "Anna" },
          { rating: 4, title: "Love the vibe", body: "Great fit and quality.", authorName: "Noah" },
        ]
      }
    },
    {
      name: "D960 Tee",
      slug: "d960-tee",
      description: "Graphic tee inspired by Schubert's Piano Sonata in B-flat, D960.",
      priceCents: 3200,
      currency: "USD",
      images: ["/img/tshirts/d960-front.jpg"],
      colorOptions: ["Cream", "Black"],
      sizeOptions: ["S", "M", "L", "XL"],
      category: "PIECE",
      reviews: { create: [{ rating: 5, title: "Stunning design", body: "Really makes a statement.", authorName: "Leo" }] }
    },
    {
      name: "Tempest Tee",
      slug: "tempest-tee",
      description: "Washed vintage-style tee inspired by Beethoven’s Tempest Sonata.",
      priceCents: 2900,
      currency: "USD",
      images: ["/img/tshirts/tempest.jpg"],
      colorOptions: ["Cream", "Black"],
      sizeOptions: ["S", "M", "L"],
      category: "PIECE",
      reviews: { create: [] }
    },
    {
      name: "Rach3 Tee",
      slug: "rach3-tee",
      description: "Bold graphic tee inspired by Rachmaninoff’s Piano Concerto No. 3.",
      priceCents: 3300,
      currency: "USD",
      images: ["/img/tshirts/rach3-front.jpg"],
      colorOptions: ["Cream", "Black"],
      sizeOptions: ["S", "M", "L", "XL"],
      category: "PIECE",
      reviews: {
        create: [
          { rating: 5, title: "Epic", body: "Just like the concerto itself!", authorName: "Sophia" }
        ]
      }
    }
  ];

  for (const s of shirts) {
    await prisma.tShirt.create({ data: s });
  }
}

main()
  .then(async () => {
    console.log("Seeded.");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
