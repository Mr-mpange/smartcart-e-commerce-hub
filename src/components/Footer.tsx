import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Mail } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-secondary/50 border-t mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary" />
              <span className="text-xl font-bold">SmartCart</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your trusted multi-vendor marketplace for quality products and amazing deals.
            </p>
            <div className="flex gap-3">
              <a href="#" className="h-9 w-9 rounded-full bg-background flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-background flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-background flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-background flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-semibold mb-4">Shop</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/products" className="hover:text-primary transition-colors">All Products</Link></li>
              <li><Link to="/categories" className="hover:text-primary transition-colors">Categories</Link></li>
              <li><Link to="/products" className="hover:text-primary transition-colors">Best Sellers</Link></li>
              <li><Link to="/products" className="hover:text-primary transition-colors">New Arrivals</Link></li>
              <li><Link to="/deals" className="hover:text-primary transition-colors">Deals</Link></li>
            </ul>
          </div>

          {/* Vendor */}
          <div>
            <h3 className="font-semibold mb-4">Vendor</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/vendors" className="hover:text-primary transition-colors">Become a Vendor</Link></li>
              <li><Link to="/vendor/dashboard" className="hover:text-primary transition-colors">Vendor Dashboard</Link></li>
              <li><Link to="/vendors" className="hover:text-primary transition-colors">Vendor Guidelines</Link></li>
              <li><Link to="/vendors" className="hover:text-primary transition-colors">Support</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link to="/" className="hover:text-primary transition-colors">FAQs</Link></li>
              <li><Link to="/" className="hover:text-primary transition-colors">Shipping Info</Link></li>
              <li><Link to="/" className="hover:text-primary transition-colors">Returns</Link></li>
              <li><Link to="/" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 SmartCart. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
