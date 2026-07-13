package com.thewhisk.bakery.model;

/**
 * POJO matching MongoDB Order item schema.
 * Used in OrderController which returns 503 (MongoDB not connected).
 */
public class OrderItem {

    private String productId;
    private String name;
    private double price;
    private int quantity;
    private String image;

    public OrderItem() {}

    public OrderItem(String productId, String name, double price, int quantity, String image) {
        this.productId = productId;
        this.name = name;
        this.price = price;
        this.quantity = quantity;
        this.image = image;
    }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }
}
