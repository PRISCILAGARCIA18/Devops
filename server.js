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
const PORT = process.env.PORT || 3001;

if (!MONGO_URI) {
  console.log("❌ Falta MONGO_URI en .env");
  console.log("   Ejemplo: MONGO_URI=mongodb://localhost:27017/insumos_oficina");
  process.exit(1);
}

// =======================
// MODELO (Mongoose)
// =======================
const pedidoSchema = new mongoose.Schema(
  {
    solicitante: { type: String, required: true, trim: true },
    insumo: { type: String, required: true, trim: true },
    cantidad: { type: Number, required: true, min: 1 },
    fecha: { type: Date, required: true },
    estado: { type: String, default: "Pendiente" },
  },
  { timestamps: true }
);

const Pedido = mongoose.model("Pedido", pedidoSchema);

// =======================
// CONEXIÓN MONGODB
// =======================
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => {
    console.error("❌ Error conectando a MongoDB:", err.message);
    process.exit(1);
  });

// =======================
// RUTAS API
// =======================

// Crear pedido
app.post("/api/pedidos", async (req, res) => {
  try {
    const { solicitante, insumo, cantidad, fecha, estado } = req.body;

    if (!solicitante || !insumo || !cantidad || !fecha) {
      return res.status(400).json({ error: "Campos requeridos faltantes" });
    }

    const nuevo = new Pedido({
      solicitante: String(solicitante).trim(),
      insumo: String(insumo).trim(),
      cantidad: Number(cantidad),
      fecha: new Date(fecha),
      estado: estado ? String(estado) : "Pendiente",
    });

    await nuevo.save();
    res.status(201).json(nuevo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al guardar pedido" });
  }
});

// Listar pedidos (más recientes primero)
app.get("/api/pedidos", async (req, res) => {
  try {
    const pedidos = await Pedido.find().sort({ createdAt: -1 });
    res.json(pedidos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
});

// ✅ Actualizar SOLO el estado (Pendiente → Aprobado/Entregado)
app.patch("/api/pedidos/:id/estado", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const allowed = ["Pendiente", "Aprobado", "Entregado"];
    if (!allowed.includes(estado)) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    const updated = await Pedido.findByIdAndUpdate(
      id,
      { estado },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Pedido no encontrado" });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando estado" });
  }
});

// Ruta fallback para abrir la app
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});