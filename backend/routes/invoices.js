const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

const supabase = createClient(
  process.env.SUPABASE_URL || "https://cqdxnjhyoxqxofyhzgov.supabase.co",
  process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZHhuamh5b3hxeG9meWh6Z292Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1ODYzNjcsImV4cCI6MjA5MDE2MjM2N30.gOMC8DwXfGPM1IOwwpJdOU6YVoAQCHvuF1tW5Sd3WzI",
);

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

// Helper to generate Invoice Number
async function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  try {
    const { count, error } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .gte("created_at", `${year}-01-01T00:00:00Z`);

    if (error) throw error;
    const nextNum = (count || 0) + 1;
    return `INV-${year}-${nextNum.toString().padStart(4, "0")}`;
  } catch (err) {
    console.error("[InvoiceNumber] Error:", err.message);
    return `INV-${year}-${Math.floor(Math.random() * 9000 + 1000)}`;
  }
}

// Helper to calculate GST (18% split)
function calculateGST(total) {
  const total_amt = Number(total);
  const subtotal = (total_amt / 1.18).toFixed(2);
  const total_gst = (total_amt - Number(subtotal)).toFixed(2);
  const sgst = (Number(total_gst) / 2).toFixed(2);
  const cgst = (Number(total_gst) / 2).toFixed(2);

  return {
    subtotal: Number(subtotal),
    gst_amount: Number(total_gst),
    cgst: Number(cgst),
    sgst: Number(sgst),
    total_amount: total_amt,
  };
}

// 1. Generate & Save Invoice
router.post("/generate", async (req, res) => {
  const {
    order_id,
    user_id,
    customer_name,
    customer_email,
    total_amount,
    items,
  } = req.body;

  if (!order_id || !total_amount) {
    return res
      .status(400)
      .json({ success: false, error: "Missing required order details" });
  }

  try {
    // Check if invoice already exists
    const { data: existing } = await supabase
      .from("invoices")
      .select("*")
      .eq("order_id", order_id)
      .maybeSingle();
    if (existing) return res.json({ success: true, invoice: existing });

    const invoice_id_formatted = await generateInvoiceNumber();
    const gstData = calculateGST(total_amount);

    const { data, error } = await supabase
      .from("invoices")
      .insert([
        {
          invoice_id: invoice_id_formatted,
          order_id,
          user_id,
          customer_name,
          customer_email,
          total_amount: gstData.total_amount,
          subtotal: gstData.subtotal,
          gst_amount: gstData.gst_amount,
          status: "Generated",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Automatically trigger email if email is provided
    if (
      customer_email &&
      process.env.RESEND_API_KEY &&
      process.env.RESEND_API_KEY !== "re_placeholder"
    ) {
      try {
        await sendInvoiceEmail(data, items, gstData);
      } catch (emailErr) {
        console.error("[InvoiceEmail] Failed to send:", emailErr.message);
      }
    }

    res.json({ success: true, invoice: data });
  } catch (err) {
    console.error("[InvoiceGenerate] Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Generate/Fetch Invoice by Order ID
router.get("/order/:order_id", async (req, res) => {
  const { order_id } = req.params;
  try {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("order_id", order_id)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    if (data) return res.json({ success: true, invoice: data });

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderErr) throw orderErr;

    const total = order.total_price || 0;
    const gstData = calculateGST(total);
    const invoice_id_formatted = await generateInvoiceNumber();

    const { data: newInvoice, error: createError } = await supabase
      .from("invoices")
      .insert([
        {
          invoice_id: invoice_id_formatted,
          order_id: order.id,
          user_id: order.user_id,
          customer_name: order.customer_name || "Artisan Guest",
          customer_email: order.user_email || "guest@thewhisk.com",
          total_amount: gstData.total_amount,
          subtotal: gstData.subtotal,
          gst_amount: gstData.gst_amount,
          status: "Paid",
          shop_name: "The Whisk Bakery",
          shop_address:
            "123 Artisan Lane, Flour District, Bangalore, Karnataka - 560001",
          shop_gstin: "29AAAAA0000A1Z5",
        },
      ])
      .select()
      .single();


    if (createError) throw createError;
    res.json({ success: true, invoice: newInvoice });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Admin: Fetch All Invoices
router.get("/all", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, invoices: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Admin: Update Invoice Details
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    customer_name,
    customer_email,
    total_amount,
    subtotal,
    gst_amount,
    status,
    invoice_id,
    shop_name,
    shop_address,
    shop_gstin,
  } = req.body;
  try {
    const { data, error } = await supabase
      .from("invoices")
      .update({
        customer_name,
        customer_email,
        total_amount,
        subtotal,
        gst_amount,
        status,
        invoice_id,
        shop_name,
        shop_address,
        shop_gstin,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, invoice: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Email Service Helper
async function sendInvoiceEmail(invoice, items = [], gstData) {
  const itemListHtml = items
    .map(
      (item) => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name || item.product_name}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity || item.qty || 1}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * (item.quantity || item.qty || 1)).toFixed(2)}</td>
        </tr>
    `,
    )
    .join("");

  const emailHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden; color: #333;">
            <div style="background: #4A2A1A; padding: 30px; text-align: center;">
                <h1 style="color: #FFF8E7; margin: 0; font-size: 24px; letter-spacing: 2px;">THE WHISK BAKERY</h1>
                <p style="color: #F59E0B; margin: 5px 0 0; font-size: 12px; text-transform: uppercase; font-weight: bold;">Artisan Goods & Fine Pastries</p>
            </div>
            
            <div style="padding: 40px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                    <div>
                        <h2 style="margin: 0; color: #4A2A1A; font-size: 18px;">INVOICE</h2>
                        <p style="margin: 5px 0; color: #666; font-size: 12px;"># ${invoice.invoice_id}</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 0; font-size: 12px; color: #666;">Date: ${new Date(invoice.created_at).toLocaleDateString()}</p>
                    </div>
                </div>

                <div style="margin-bottom: 30px; background: #fafafa; padding: 20px; border-radius: 8px;">
                    <p style="margin: 0 0 10px; font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase;">Customer Details</p>
                    <p style="margin: 0; font-weight: bold; font-size: 14px;">${invoice.customer_name}</p>
                    <p style="margin: 2px 0 0; color: #666; font-size: 12px;">${invoice.customer_email}</p>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <thead>
                        <tr style="background: #fdfdfd;">
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #4A2A1A; font-size: 12px; text-transform: uppercase; color: #999;">Item</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #4A2A1A; font-size: 12px; text-transform: uppercase; color: #999;">Qty</th>
                            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #4A2A1A; font-size: 12px; text-transform: uppercase; color: #999;">Price</th>
                            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #4A2A1A; font-size: 12px; text-transform: uppercase; color: #999;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemListHtml}
                    </tbody>
                </table>

                <div style="margin-left: auto; width: 250px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
                        <span style="color: #666;">Subtotal:</span>
                        <span style="font-weight: bold;">₹${invoice.subtotal}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px; color: #888;">
                        <span>CGST (9%):</span>
                        <span>₹${(invoice.gst_amount / 2).toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 11px; color: #888;">
                        <span>SGST (9%):</span>
                        <span>₹${(invoice.gst_amount / 2).toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding-top: 15px; border-top: 2px solid #eee;">
                        <span style="font-weight: bold; color: #4A2A1A;">Total Amount:</span>
                        <span style="font-weight: bold; color: #FF6B35; font-size: 18px;">₹${invoice.total_amount}</span>
                    </div>
                </div>
            </div>

            <div style="background: #fdfdfd; padding: 20px; text-align: center; border-top: 1px solid #f0f0f0;">
                <p style="margin: 0; font-size: 11px; color: #999;">GSTIN: 29AAAAA0000A1Z5 | FSSAI: 12345678901234</p>
                <p style="margin: 5px 0 0; font-size: 11px; color: #999;">Thank you for choosing The Whisk Bakery!</p>
            </div>
        </div>
    `;

  return await resend.emails.send({
    from: "The Whisk <orders@resend.dev>",
    to: invoice.customer_email,
    subject: `Your Invoice from The Whisk - ${invoice.invoice_id}`,
    html: emailHtml,
  });
}

module.exports = router;
