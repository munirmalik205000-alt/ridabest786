import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ShoppingBag, Plus, Storefront, Package, Heart, ShoppingCart, Star } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Shopping = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Sports']);
  const [addProductDialog, setAddProductDialog] = useState(false);
  const [becomeVendorDialog, setBecomeVendorDialog] = useState(false);
  const [isVendor, setIsVendor] = useState(false);
  
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image_url: ''
  });

  useEffect(() => {
    fetchProducts();
    checkVendorStatus();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/products`, {
        withCredentials: true
      });
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const checkVendorStatus = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/vendor/status`, {
        withCredentials: true
      });
      setIsVendor(data.is_vendor);
    } catch (error) {
      console.error('Failed to check vendor status:', error);
    }
  };

  const handleBecomeVendor = async () => {
    try {
      await axios.post(`${API_URL}/api/vendor/register`, {}, {
        withCredentials: true
      });
      toast.success('You are now a vendor!');
      setBecomeVendorDialog(false);
      setIsVendor(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to become vendor');
    }
  };

  const handleAddProduct = async () => {
    try {
      await axios.post(`${API_URL}/api/products`, productForm, {
        withCredentials: true
      });
      toast.success('Product added successfully!');
      setAddProductDialog(false);
      setProductForm({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        image_url: ''
      });
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add product');
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      await axios.post(`${API_URL}/api/cart/add`, {
        product_id: productId,
        quantity: 1
      }, {
        withCredentials: true
      });
      toast.success('Added to cart!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add to cart');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              className="text-white hover:bg-white/10"
              data-testid="back-btn"
            >
              <ArrowLeft size={24} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="shopping-title">
                Shopping Marketplace
              </h1>
              <p className="text-purple-100 text-sm">Multi-vendor platform like Meesho & Flipkart</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/cart')}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              data-testid="cart-btn"
            >
              <ShoppingCart size={20} className="mr-2" />
              Cart
            </Button>
            {!isVendor ? (
              <Dialog open={becomeVendorDialog} onOpenChange={setBecomeVendorDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    data-testid="become-vendor-btn"
                  >
                    <Storefront size={20} className="mr-2" />
                    Become Vendor
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="become-vendor-dialog">
                  <DialogHeader>
                    <DialogTitle>Become a Vendor</DialogTitle>
                    <DialogDescription>
                      Start selling your products on our platform
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <p className="text-sm text-slate-600">
                      ✓ No registration fee<br />
                      ✓ Reach millions of customers<br />
                      ✓ Easy product management<br />
                      ✓ Instant payments
                    </p>
                    <Button
                      onClick={handleBecomeVendor}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      data-testid="confirm-vendor-btn"
                    >
                      Become Vendor Now
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Dialog open={addProductDialog} onOpenChange={setAddProductDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    data-testid="add-product-btn"
                  >
                    <Plus size={20} className="mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="add-product-dialog">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription>Add your product to the marketplace</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Product Name</Label>
                      <Input
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        placeholder="e.g., Samsung Galaxy S24"
                        className="border-2 border-purple-600 rounded-xl"
                        data-testid="product-name-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        placeholder="Product description"
                        className="border-2 border-purple-600 rounded-xl"
                        rows={3}
                        data-testid="product-description-input"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Price (₹)</Label>
                        <Input
                          type="number"
                          value={productForm.price}
                          onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                          placeholder="999"
                          className="border-2 border-purple-600 rounded-xl"
                          data-testid="product-price-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Stock</Label>
                        <Input
                          type="number"
                          value={productForm.stock}
                          onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                          placeholder="50"
                          className="border-2 border-purple-600 rounded-xl"
                          data-testid="product-stock-input"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={productForm.category} onValueChange={(value) => setProductForm({ ...productForm, category: value })}>
                        <SelectTrigger className="border-2 border-purple-600 rounded-xl" data-testid="product-category-select">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Image URL</Label>
                      <Input
                        value={productForm.image_url}
                        onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        className="border-2 border-purple-600 rounded-xl"
                        data-testid="product-image-input"
                      />
                    </div>
                    <Button
                      onClick={handleAddProduct}
                      className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl h-11"
                      data-testid="submit-product-btn"
                    >
                      Add Product
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            All Products
          </h2>
          <p className="text-slate-600">Browse products from multiple vendors</p>
        </div>

        {products.length === 0 ? (
          <Card className="p-12 text-center border-slate-200 rounded-2xl" data-testid="no-products">
            <Package size={64} className="mx-auto text-slate-400 mb-4" weight="duotone" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">No Products Yet</h3>
            <p className="text-slate-600 mb-4">Be the first vendor to add products!</p>
            {!isVendor && (
              <Button
                onClick={() => setBecomeVendorDialog(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Become a Vendor
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product, idx) => (
              <motion.div
                key={product._id || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all" data-testid={`product-card-${idx}`}>
                  <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={64} className="text-purple-400" weight="duotone" />
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-slate-900 line-clamp-1">{product.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2">{product.description}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-purple-600" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        ₹{product.price}
                      </p>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star size={16} weight="fill" />
                        <span className="text-sm font-medium">4.5</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleAddToCart(product._id)}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 rounded-xl h-9"
                        data-testid={`add-to-cart-btn-${idx}`}
                      >
                        <ShoppingCart size={16} className="mr-1" />
                        Add to Cart
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-xl border-purple-300"
                      >
                        <Heart size={18} weight="duotone" className="text-purple-600" />
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">
                      Stock: {product.stock} | Vendor: {product.vendor_name || 'Unknown'}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shopping;
