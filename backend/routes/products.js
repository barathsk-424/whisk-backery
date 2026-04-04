const express = require("express");
const { supabase } = require("../config/supabase");
const router = express.Router();

// ─── GET /api/products ──────────────────────────────────────────
// Fetch all products (public — no auth needed)
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ products: data });
  } catch (err) {
    res.status(500).json({ error: "Server error fetching products" });
  }
});

// ─── POST /api/products ─────────────────────────────────────────
// Create a custom product (authenticated clients can save builder configurations as products)
const authenticate = require("../middleware/auth");
router.post("/", authenticate, async (req, res) => {
  const { name, price, image } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: "name and price are required" });
  }

  try {
    const { data, error } = await req.supabase
      .from("products")
      .insert({
        name,
        price,
        image:
          image ||
          "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop",
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json({ product: data });
  } catch (err) {
    res.status(500).json({ error: "Server error creating product" });
  }
});

// ─── GET /api/products/:id ──────────────────────────────────────
// Fetch a single product by ID
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ product: data });
  } catch (err) {
    res.status(500).json({ error: "Server error fetching product" });
  }
});

module.exports = router;
