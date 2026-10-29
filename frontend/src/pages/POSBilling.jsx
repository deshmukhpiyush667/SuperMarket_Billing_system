import React, { useState, useEffect, useRef } from 'react';
import { 
  Barcode, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingCart, 
  CreditCard, 
  Wallet, 
  QrCode, 
  X, 
  CheckCircle, 
  IndianRupee,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { productApi } from '../api/productApi';
import { categoryApi } from '../api/categoryApi';
import { saleApi } from '../api/saleApi';
import { useNotification } from '../context/NotificationContext';
import InvoiceModal from '../components/InvoiceModal';

const POSBilling = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Cart state
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderDiscount, setOrderDiscount] = useState(0);

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // CASH, CARD, UPI
  const [amountTendered, setAmountTendered] = useState('');
  const [submittingSale, setSubmittingSale] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);

  const barcodeInputRef = useRef(null);
  const { success, error, warning } = useNotification();

  // Load products and categories on mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Keyboard shortcut listener (e.g. F2 to focus barcode)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productApi.getProducts({ active: true, size: 100 });
      if (res.data?.success) {
        setProducts(res.data.data.content || []);
      }
    } catch (err) {
      error('Failed to load product catalog');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await categoryApi.getAll(true);
      if (res.data?.success) {
        setCategories(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add product to cart
  const addToCart = (product) => {
    if (product.stockQuantity <= 0) {
      warning(`Product "${product.name}" is completely out of stock.`);
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          warning(`Cannot exceed available stock of ${product.stockQuantity} for "${product.name}"`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            product,
            quantity: 1,
            discountAmount: 0,
          },
        ];
      }
    });
  };

  // Barcode scanner submission
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    try {
      const res = await productApi.getByBarcode(code);
      if (res.data?.success && res.data.data) {
        addToCart(res.data.data);
        setBarcodeInput('');
        success(`Added "${res.data.data.name}"`);
      } else {
        warning(`No product found with barcode ${code}`);
      }
    } catch (err) {
      warning(`No product matches barcode: ${code}`);
    }
  };

  // Update item quantity
  const updateQuantity = (productId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null; // remove
            if (newQty > item.product.stockQuantity) {
              warning(`Max available stock is ${item.product.stockQuantity}`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  // Update item discount
  const updateItemDiscount = (productId, discount) => {
    const val = parseFloat(discount) || 0;
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product.id === productId) {
          const maxDiscount = item.product.unitPrice * item.quantity;
          return { ...item, discountAmount: Math.min(val, maxDiscount) };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setOrderDiscount(0);
  };

  // Front-end preview calculations (backend validates strictly via BigDecimal)
  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;
    let totalItemDiscounts = 0;

    cart.forEach((item) => {
      const gross = item.product.unitPrice * item.quantity;
      const disc = Number(item.discountAmount) || 0;
      const taxable = Math.max(0, gross - disc);
      const tax = (taxable * item.product.taxRate) / 100;

      subtotal += taxable;
      totalTax += tax;
      totalItemDiscounts += disc;
    });

    const overallDiscount = Number(orderDiscount) || 0;
    const grandTotal = Math.max(0, subtotal + totalTax - overallDiscount);

    return {
      subtotal,
      totalTax,
      totalDiscount: totalItemDiscounts + overallDiscount,
      grandTotal,
    };
  };

  const { subtotal, totalTax, totalDiscount, grandTotal } = calculateTotals();

  // Handle Complete Sale Transaction
  const handleConfirmSale = async () => {
    if (cart.length === 0) {
      error('Shopping cart is empty');
      return;
    }

    if (paymentMethod === 'CASH') {
      const tendered = parseFloat(amountTendered);
      if (isNaN(tendered) || tendered < grandTotal) {
        error(`Amount tendered (₹${tendered || 0}) is less than total payable (₹${grandTotal.toFixed(2)})`);
        return;
      }
    }

    const payload = {
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        discountAmount: item.discountAmount || 0,
      })),
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim() || null,
      paymentMethod,
      discountAmount: Number(orderDiscount) || 0,
      amountTendered: paymentMethod === 'CASH' ? parseFloat(amountTendered) : grandTotal,
      notes: `POS Transaction via ${paymentMethod}`,
    };

    try {
      setSubmittingSale(true);
      const res = await saleApi.createSale(payload);
      if (res.data?.success) {
        success(`Invoice ${res.data.data.invoiceNumber} completed successfully!`);
        setCompletedSale(res.data.data);
        setIsPaymentModalOpen(false);
        clearCart();
        setAmountTendered('');
        // Refresh catalog so stock numbers decrease immediately
        fetchProducts();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Transaction failed. Please try again.');
    } finally {
      setSubmittingSale(false);
    }
  };

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-5.5rem)]">
      {/* Left Column: Product Search & Grid */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Top search & barcode bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Barcode scanner input */}
            <form onSubmit={handleBarcodeSubmit} className="relative sm:w-1/2">
              <Barcode className="w-5 h-5 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan / Enter Barcode (F2)..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden transition-all shadow-2xs"
              />
            </form>

            {/* Keyword search input */}
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search product name, SKU..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Category filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                selectedCategory === null
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  selectedCategory === c.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <Layers className="w-12 h-12 mb-2 text-slate-300" />
              <p className="text-sm font-medium">No matching products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stockQuantity <= 0;
                const isLow = p.stockQuantity <= p.minStockLevel && !isOutOfStock;

                return (
                  <button
                    key={p.id}
                    disabled={isOutOfStock}
                    onClick={() => addToCart(p)}
                    className={`text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between group ${
                      isOutOfStock
                        ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                        : 'bg-white border-slate-200/90 hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-mono font-bold text-slate-400 truncate">
                          {p.sku}
                        </span>
                        {isOutOfStock ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">
                            Low: {p.stockQuantity}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">
                            Stock: {p.stockQuantity} {p.measurementUnit}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                        {p.name}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-black text-slate-900">
                          ₹{Number(p.unitPrice).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          GST {p.taxRate}%
                        </span>
                      </div>
                      <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-colors">
                        <Plus className="w-4 h-4" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Checkout Cart & Billing Register */}
      <div className="w-full lg:w-[420px] xl:w-[460px] flex flex-col bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-none">Register Cart</h3>
              <p className="text-[11px] text-slate-400 mt-1">{cart.length} distinct item(s)</p>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Customer Info Inputs */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Customer Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Walk-in Customer"
              className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone (Optional)</label>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {cart.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-center px-4">
              <ShoppingCart className="w-10 h-10 mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">Cart is empty</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Scan a barcode or click products to begin sale</p>
            </div>
          ) : (
            cart.map((item) => {
              const gross = item.product.unitPrice * item.quantity;
              const disc = Number(item.discountAmount) || 0;
              const taxable = Math.max(0, gross - disc);
              const lineTax = (taxable * item.product.taxRate) / 100;
              const lineTotal = taxable + lineTax;

              return (
                <div
                  key={item.product.id}
                  className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col gap-2 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{item.product.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        ₹{Number(item.product.unitPrice).toFixed(2)} × {item.quantity} | GST {item.product.taxRate}%
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {/* Quantity Stepper */}
                    <div className="flex items-center bg-white border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="p-1 hover:bg-slate-100 text-slate-600 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="p-1 hover:bg-slate-100 text-slate-600 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Discount input */}
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <span>Disc:</span>
                      <input
                        type="number"
                        min="0"
                        value={item.discountAmount || ''}
                        placeholder="0"
                        onChange={(e) => updateItemDiscount(item.product.id, e.target.value)}
                        className="w-14 px-1.5 py-0.5 text-right bg-white border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900">
                        ₹{lineTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bill Summary Calculations */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal (Taxable):</span>
            <span className="font-semibold text-slate-800">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Total GST (Taxes):</span>
            <span className="font-semibold text-slate-800">₹{totalTax.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span>Order Discount:</span>
            <div className="flex items-center gap-1">
              <span>- ₹</span>
              <input
                type="number"
                min="0"
                value={orderDiscount || ''}
                placeholder="0"
                onChange={(e) => setOrderDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-16 px-1.5 py-0.5 text-right bg-white border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {totalDiscount > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold text-[11px]">
              <span>Total Savings:</span>
              <span>₹{totalDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Payable</p>
              <h2 className="text-2xl font-black text-emerald-600 tracking-tight">
                ₹{grandTotal.toFixed(2)}
              </h2>
            </div>

            <button
              disabled={cart.length === 0}
              onClick={() => {
                setAmountTendered(grandTotal.toFixed(2));
                setIsPaymentModalOpen(true);
              }}
              className="py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-950/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
            >
              <span>Pay & Bill</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-in">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold">Confirm Payment</h3>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Grand Total Callout */}
              <div className="text-center p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Amount Due</p>
                <h2 className="text-3xl font-black text-emerald-600 mt-1">₹{grandTotal.toFixed(2)}</h2>
              </div>

              {/* Payment Mode Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'CASH', label: 'Cash', icon: Wallet },
                    { id: 'CARD', label: 'Card / POS', icon: CreditCard },
                    { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                  ].map((mode) => {
                    const Icon = mode.icon;
                    const selected = paymentMethod === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setPaymentMethod(mode.id)}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-2 font-bold text-xs transition-all ${
                          selected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-950/20'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash Tendered & Change Return fields */}
              {paymentMethod === 'CASH' && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cash Tendered (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={amountTendered}
                      onChange={(e) => setAmountTendered(e.target.value)}
                      placeholder={grandTotal.toFixed(2)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-500">Change to Return:</span>
                    <span className="text-base text-emerald-600">
                      ₹{Math.max(0, (parseFloat(amountTendered) || 0) - grandTotal).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {paymentMethod === 'UPI' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <div className="w-32 h-32 mx-auto bg-white border-2 border-slate-300 rounded-xl flex items-center justify-center p-2 shadow-inner">
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center text-emerald-400 font-mono text-[9px] p-2 text-center rounded-lg">
                      SCAN UPI QR<br />₹{grandTotal.toFixed(2)}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">Customer can scan using any UPI App</p>
                </div>
              )}

              {/* Confirm & Complete Sale Button */}
              <button
                type="button"
                disabled={submittingSale}
                onClick={handleConfirmSale}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-950/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {submittingSale ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing & Recording Sale...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Complete Sale & Issue Invoice</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice modal after completed transaction */}
      <InvoiceModal
        sale={completedSale}
        isOpen={!!completedSale}
        onClose={() => setCompletedSale(null)}
      />
    </div>
  );
};

export default POSBilling;
