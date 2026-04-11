import { supabase } from './supabase';
import { jsPDF } from 'jspdf';

const API_URL = import.meta.env.VITE_API_URL || "https://whisk-backery.onrender.com";

/**
 * Saves a new invoice archive entry to the Supabase vault.
 * @param {Object} invoiceData - Metadata including order_id, name, amount, etc.
 */
export const saveInvoiceToSupabase = async (invoiceData) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .insert([
        {
          order_id: invoiceData.order_id,
          customer_name: invoiceData.customer_name,
          amount: invoiceData.amount || invoiceData.total_amount,
          status: invoiceData.status || 'Verified',
          date: new Date().toISOString(),
          // Extend if needed: customer_email, subtotal, etc.
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[InvoiceService] Save failure:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Recovers or Generates an invoice record via the backend bridge.
 * This ensures GST calculations and shop metadata are synchronized.
 * @param {string} orderId 
 */
export const getInvoiceByOrderId = async (orderId) => {
  try {
    // 1. Attempt Backend Optimization (Auto-generates if missing)
    try {
        const response = await fetch(`${API_URL}/api/invoices/order/${orderId}`);
        if (response.ok) {
            const data = await response.json();
            if (data.success) return { success: true, data: data.invoice };
        }
    } catch (e) {
        console.warn("[InvoiceService] Backend bridge silent, falling back to Vault...");
    }

    // 2. Direct Vault Recovery
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[InvoiceService] Retrieval error:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Generates and downloads a professional PDF acquisition record using jsPDF.
 * @param {Object} invoiceData 
 * @param {Array} items - Optional items list from the order
 */
export const downloadInvoiceAsPDF = (invoiceData, items = []) => {
  try {
    const doc = new jsPDF();
    const margin = 20;
    const accentColor = [255, 107, 53]; // Orange
    const textPrimary = [74, 42, 26]; // Dark Brown
    const textMuted = [166, 124, 82]; // Light Brown
    const bgWatermark = [244, 241, 237]; // Faint Gray/Cream
    const bgCard = [250, 249, 246]; // Very Light Cream
    
    // ─── 1. WATERMARK & BACKGROUND ───
    doc.setTextColor(...bgWatermark);
    doc.setFontSize(120);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 105, 50, { angle: 330, align: 'center' });
    
    // ─── 2. HEADER: BRANDING ───
    let cursorY = 25;
    
    // Draw stylized cupcake logo
    doc.setFillColor(255, 180, 210); // Pink top
    doc.circle(28, cursorY + 5, 8, 'F');
    doc.circle(22, cursorY + 8, 6, 'F');
    doc.circle(34, cursorY + 8, 6, 'F');
    doc.setFillColor(100, 180, 255); // Blue base
    doc.rect(21, cursorY + 12, 14, 8, 'F');
    
    doc.setFontSize(30);
    doc.setTextColor(...textPrimary);
    doc.setFont('helvetica', 'bold');
    doc.text('THE WHISK', 50, cursorY + 5);
    doc.setFontSize(26);
    doc.text('BAKERY', 50, cursorY + 14);
    
    // Shop details on the left
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.setFont('helvetica', 'bold');
    doc.text('MANNIVAKKAM, CHENNAI, TAMIL NADU,', 22, cursorY + 28);
    doc.text('614001, INDIA', 22, cursorY + 32);
    doc.text('PH: +91 6374618833 // EMAIL: SKBARATH424@GMAIL.COM', 22, cursorY + 36);
    doc.setTextColor(...accentColor);
    doc.text(`GSTIN: ${invoiceData.shop_gstin || '29AAAAA0000A1Z5'}`, 22, cursorY + 42);
    
    // Invoice identifier on the right
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.text('ACQUISITION SIGNAL ID', 190, cursorY + 28, { align: 'right' });
    doc.setFontSize(18);
    doc.setTextColor(...textPrimary);
    doc.text(String(invoiceData.invoice_id || 'INV-MASTER-VAULT'), 190, cursorY + 36, { align: 'right' });
    
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.setFont('helvetica', 'normal');
    doc.text(`TIMESTAMP: ${new Date(invoiceData.created_at || Date.now()).toLocaleString()}`, 190, cursorY + 41, { align: 'right' });
    doc.text(`ORDER INDEX: #${String(invoiceData.order_id || 'REF-N3920').slice(0, 10).toUpperCase()}`, 190, cursorY + 44, { align: 'right' });

    cursorY += 60;
    doc.setDrawColor(...bgWatermark);
    doc.line(margin, cursorY, 190, cursorY);
    cursorY += 15;

    // ─── 3. RECIPIENT GRID ───
    // Draw rounded card background for "Billed To"
    doc.setFillColor(...bgCard);
    doc.setDrawColor(240, 230, 217);
    doc.roundedRect(margin, cursorY, 80, 45, 10, 10, 'FD');
    
    // Label for billed to
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin + 8, cursorY + 5, 30, 6, 3, 3, 'FD');
    doc.setFontSize(7);
    doc.setTextColor(...accentColor);
    doc.setFont('helvetica', 'bold');
    doc.text('BILLED TO CONSIGNEE', margin + 10, cursorY + 9);
    
    // Consignee details
    doc.setFontSize(16);
    doc.setTextColor(...textPrimary);
    doc.text(invoiceData.customer_name || 'Artisan Guest', margin + 10, cursorY + 22);
    doc.setFontSize(9);
    doc.setTextColor(...textMuted);
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceData.customer_email || 'guest@thewhisk.com', margin + 10, cursorY + 28);
    
    doc.setFontSize(7);
    doc.setTextColor(...textPrimary);
    doc.text('TERMINAL:', margin + 10, cursorY + 40);
    doc.setFont('helvetica', 'bold');
    doc.text('WEB-CORE-V2', margin + 25, cursorY + 40);
    
    // Shipment coordinates on the right
    const col2X = 110;
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    doc.text('SHIPMENT COORDINATES', col2X, cursorY + 10, { charSpace: 1.5 });
    
    doc.setFontSize(10);
    doc.setTextColor(...textPrimary);
    doc.setFont('helvetica', 'bold');
    const displayAddr = String(invoiceData.customer_address || 'Registered Vault Location');
    const splitAddress = doc.splitTextToSize(displayAddr, 70);
    doc.text(splitAddress, col2X, cursorY + 18);
    
    doc.setFontSize(9);
    doc.setTextColor(...accentColor);
    doc.text('Comm-Link:', col2X, cursorY + 38);
    doc.text(String(invoiceData.customer_phone || 'Link Unavailable'), col2X + 22, cursorY + 38);

    cursorY += 65;

    // ─── 4. ITEMIZATION TABLE ───
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.setFont('helvetica', 'bold');
    doc.text('BLUEPRINT DESCRIPTION', margin, cursorY, { charSpace: 1 });
    doc.text('UNIT', margin + 95, cursorY, { align: 'center', charSpace: 1 });
    doc.text('PRICE', margin + 125, cursorY, { align: 'right', charSpace: 1 });
    doc.text('ACQUISITION', 190, cursorY, { align: 'right', charSpace: 1 });
    
    cursorY += 4;
    doc.setLineWidth(0.2);
    doc.line(margin, cursorY, 190, cursorY);
    cursorY += 15;

    const itemsToRender = items.length > 0 ? items : (invoiceData.items || []);
    itemsToRender.forEach((item, index) => {
      // Check for page break (allow space for item + potentially summary if last)
      if (cursorY > 230) {
          doc.addPage();
          cursorY = 25;
          // Re-add watermark on new page
          doc.setTextColor(...bgWatermark);
          doc.setFontSize(120);
          doc.text('INVOICE', 105, 100, { angle: 330, align: 'center' });
          
          doc.setFontSize(8);
          doc.setTextColor(...textMuted);
          doc.text(`Signal ID: ${invoiceData.invoice_id} | Page ${doc.internal.getNumberOfPages()}`, margin, 15);
          
          // Re-add table header on new page
          doc.setFontSize(8);
          doc.setTextColor(...textMuted);
          doc.setFont('helvetica', 'bold');
          doc.text('BLUEPRINT DESCRIPTION', margin, cursorY, { charSpace: 1 });
          doc.text('UNIT', margin + 95, cursorY, { align: 'center', charSpace: 1 });
          doc.text('PRICE', margin + 125, cursorY, { align: 'right', charSpace: 1 });
          doc.text('ACQUISITION', 190, cursorY, { align: 'right', charSpace: 1 });
          cursorY += 15;
      }

      doc.setFontSize(12);
      doc.setTextColor(...textPrimary);
      doc.setFont('helvetica', 'bold');
      doc.text((item.name || item.product_name || 'ARTISAN CAKE').toUpperCase(), margin, cursorY);
      
      doc.setFontSize(7);
      doc.setTextColor(...accentColor);
      doc.setFont('helvetica', 'italic');
      doc.text(`FLAVOR: ${item.flavor || 'Truffle'}`, margin, cursorY + 5);
      doc.setTextColor(...textMuted);
      doc.text(`SHAPE: ${item.shape || 'Round'}`, margin + 30, cursorY + 5);
      
      doc.setFontSize(10);
      doc.setTextColor(...textMuted);
      doc.setFont('helvetica', 'normal');
      doc.text(String(item.quantity || item.qty || 1), margin + 95, cursorY, { align: 'center' });
      doc.text(`Rs. ${item.price || 0}`, margin + 125, cursorY, { align: 'right' });
      
      doc.setFontSize(12);
      doc.setTextColor(...textPrimary);
      doc.setFont('helvetica', 'bold');
      doc.text(`Rs. ${((item.price || 0) * (item.quantity || item.qty || 1)).toLocaleString()}`, 190, cursorY, { align: 'right' });
      
      cursorY += 20;
    });

    // ─── 5. SETTLEMENT SUMMARY ───
    if (cursorY > 190) { // If not enough room for summary + footer
        doc.addPage();
        cursorY = 30;
    } else {
        cursorY = Math.max(cursorY, 180);
    }
    
    doc.setLineWidth(0.1);
    doc.setDrawColor(...bgWatermark);
    doc.line(margin + 100, cursorY, 190, cursorY);
    cursorY += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(...textMuted);
    doc.setFont('helvetica', 'bold');
    doc.text('SUBTOTAL', margin + 100, cursorY, { charSpace: 1 });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Rs. ${Number(invoiceData.subtotal || 0).toFixed(2)}`, 190, cursorY, { align: 'right' });
    
    cursorY += 8;
    doc.setFontSize(9);
    doc.text('CGST (9%)', margin + 100, cursorY);
    doc.text(`Rs. ${Number(invoiceData.gst_amount / 2 || 0).toFixed(2)}`, 190, cursorY, { align: 'right' });
    cursorY += 6;
    doc.text('SGST (9%)', margin + 100, cursorY);
    doc.text(`Rs. ${Number(invoiceData.gst_amount / 2 || 0).toFixed(2)}`, 190, cursorY, { align: 'right' });
    
    cursorY += 12;
    doc.setLineWidth(1.5);
    doc.setDrawColor(...accentColor);
    doc.line(margin + 100, cursorY, 190, cursorY);
    
    cursorY += 12;
    doc.setFontSize(10);
    doc.setTextColor(...accentColor);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL DUE', margin + 100, cursorY, { charSpace: 2 });
    doc.setFontSize(6);
    doc.setTextColor(200, 200, 200);
    doc.text('Financial integrity verified', margin + 100, cursorY + 4);
    
    doc.setFontSize(28); 
    doc.setTextColor(...textPrimary);
    doc.text(`Rs. ${Number(invoiceData.total_amount || 0).toLocaleString()}`, 190, cursorY + 7, { align: 'right' });

    // ─── 6. PREMIUM FOOTER ───
    doc.setTextColor(...bgWatermark);
    doc.setFontSize(90);
    doc.setFont('helvetica', 'bold');
    doc.text('WHISK', 105, 280, { align: 'center' });
    
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.setFont('helvetica', 'bold');
    doc.text('DIGITAL AUTH SIGNATURE', 65, 270, { align: 'center' });
    doc.text('MASTER ARTISAN SEAL', 145, 270, { align: 'center' });
    doc.line(45, 265, 85, 265);
    doc.line(125, 265, 165, 265);
    
    doc.setFontSize(7);
    doc.setTextColor(200, 200, 200);
    doc.text('THE WHISK BAKERY // STANDARD ACQUISITION TREATY V2.0', 105, 285, { align: 'center', charSpace: 4 });
    doc.setFontSize(8);
    doc.setTextColor(...textPrimary);
    doc.text('Thank you for commissioning an artisan masterpiece.', 105, 292, { align: 'center' });

    doc.save(`Invoice_${invoiceData.invoice_id || 'Signal'}.pdf`);

    return { success: true };
  } catch (err) {
    console.error('[PDF Generator] Fatal error:', err.message);
    return { success: false, error: err.message };
  }
};
