const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ✅ Lee la URI desde .env
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.log("❌ Falta MONGO_URI en .env");
  console.log("   Ejemplo: MONGO_URI=mongodb://localhost:27017/insumos_oficina");
  process.exit(1);
}

// Conexión a MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => {
    console.log("❌ Error MongoDB:", err.message);
    process.exit(1);
  });

// Modelo
const PedidoSchema = new mongoose.Schema(
  {
    solicitante: { type: String, required: true, trim: true },
    insumo: { type: String, required: true, trim: true },
    cantidad: { type: Number, required: true, min: 1 },
    fecha: { type: Date, required: true },
    estado: { type: String, default: "Pendiente" }
  },
  { timestamps: true }
);

const Pedido = mongoose.model("Pedido", PedidoSchema, "pedidos");

// Crear pedido
app.post("/api/pedidos", async (req, res) => {
  try {
    const { solicitante, insumo, cantidad, fecha, estado } = req.body;

    if (!solicitante || !insumo || !cantidad || !fecha) {
      return res.status(400).json({ error: "Faltan campos obligatorios." });
    }

    const pedido = await Pedido.create({
      solicitante,
      insumo,
      cantidad: Number(cantidad),
      fecha: new Date(fecha),
      estado: estado || "Pendiente"
    });

    res.status(201).json(pedido);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Listar pedidos
app.get("/api/pedidos", async (req, res) => {
  try {
    const pedidos = await Pedido.find().sort({ createdAt: -1 });
    res.json(pedidos);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ✅ Un solo listen (NO duplicado)

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

