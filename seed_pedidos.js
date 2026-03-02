// seed_pedidos.js
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/insumos_oficina";

// Ajusta cantidad sin tocar código: $env:TOTAL="20000"
const TOTAL = parseInt(process.env.TOTAL || "20000", 10);
// inserts por bloque: $env:BATCH="1000"
const BATCH = parseInt(process.env.BATCH || "1000", 10);

// OJO: tu front espera estos campos: solicitante, insumo, cantidad, fecha, estado
const pedidoSchema = new mongoose.Schema(
  {
    solicitante: String,
    insumo: String,
    cantidad: Number,
    fecha: Date,
    estado: { type: String, enum: ["Pendiente", "Aprobado", "Entregado"], default: "Pendiente" },
    createdAt: { type: Date, default: Date.now }
  },
  { collection: "pedidos" } // <<< IMPORTANTÍSIMO: misma colección que muestra tu página
);

const Pedido = mongoose.model("Pedido", pedidoSchema);

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDateLastDays(days = 30) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * days));
  d.setHours(0, 0, 0, 0);
  return d;
}

async function run() {
  console.log("Conectando...");
  await mongoose.connect(MONGO_URI);

  console.log(`Insertando pedidos: TOTAL=${TOTAL}, BATCH=${BATCH}`);
  let inserted = 0;

  // Si quieres “sobrecargar” sin borrar lo anterior: DEJA ESTO COMENTADO
  // Si quieres REEMPLAZAR todo: descomenta
  // await Pedido.deleteMany({});

  const solicitantes = ["Priscila García", "Juan Pérez", "Ana López", "Carlos Ruiz", "María Torres"];
  const insumos = [
    "Hojas tamaño carta", "Plumas azules", "Tóner HP", "Engrapadora",
    "Cinta adhesiva", "Carpetas", "Mouse", "Teclado", "Cloro", "Jabón"
  ];
  const estados = ["Pendiente", "Aprobado", "Entregado"];

  while (inserted < TOTAL) {
    const size = Math.min(BATCH, TOTAL - inserted);

    const docs = Array.from({ length: size }, (_, i) => ({
      solicitante: randomItem(solicitantes),
      insumo: `${randomItem(insumos)} #${inserted + i + 1}`,
      cantidad: Math.floor(Math.random() * 20) + 1,
      fecha: randomDateLastDays(45),
      estado: randomItem(estados),
      createdAt: new Date()
    }));

    await Pedido.insertMany(docs, { ordered: false });
    inserted += size;
    console.log(`✅ Insertados: ${inserted}/${TOTAL}`);
  }

  console.log("Listo. Cerrando conexión.");
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("❌ Error:", err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});