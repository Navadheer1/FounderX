'use client';

import { useEffect, useMemo, useState } from 'react';
import Navbar from '../../components/Navbar';
import CheckoutModal from '../../components/shop/CheckoutModal';
import { ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('fx_cart');
      const current = raw ? JSON.parse(raw) : [];
      setItems(current);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateQuantity = (productId, quantity) => {
    setItems((prev) => {
      const next = prev
        .map((item) =>
          item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item
        )
        .filter((item) => item.quantity > 0);
      if (typeof window !== 'undefined') {
        localStorage.setItem('fx_cart', JSON.stringify(next));
      }
      return next;
    });
  };

  const removeItem = (productId) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.productId !== productId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('fx_cart', JSON.stringify(next));
      }
      return next;
    });
  };

  const clearCart = () => {
    setItems([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fx_cart');
    }
  };

  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const price = item.product?.price || 0;
        return sum + price * item.quantity;
      }, 0),
    [items]
  );

  const checkoutItems = useMemo(
    () =>
      items.map((item) => ({
        product: item.product,
        quantity: item.quantity
      })),
    [items]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-12">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-sm text-gray-600 hover:text-primary mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Continue browsing
        </button>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your cart</h1>
              <p className="text-sm text-gray-500">
                {items.length} {items.length === 1 ? 'item' : 'items'} from FounderX startups
              </p>
            </div>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="inline-flex items-center text-xs text-gray-500 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear cart
            </button>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-2/3 mb-3" />
            <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
            <div className="h-4 bg-gray-100 rounded w-1/3" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <p className="text-gray-600 mb-3">Your cart is empty.</p>
            <p className="text-sm text-gray-500 mb-6">
              Browse the shop to discover products from startups on FounderX.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-black transition"
            >
              Go to shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4"
                >
                  <div className="h-16 w-16 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0">
                    {item.product?.images?.[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ShoppingCart className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {item.product?.name || 'Product'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {item.product?.startupId?.name || 'Startup'}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center border border-gray-200 rounded-full">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="h-7 w-7 flex items-center justify-center text-gray-600"
                        >
                          -
                        </button>
                        <span className="px-3 text-xs font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="h-7 w-7 flex items-center justify-center text-gray-600"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="text-xs text-gray-400 hover:text-red-500 inline-flex items-center"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 h-fit">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Order summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Items</span>
                  <span className="font-medium">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-medium">Free</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-3 mt-2">
                  <span className="text-gray-900 font-semibold">Total</span>
                  <span className="text-gray-900 font-bold">${total.toFixed(2)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckout(true)}
                disabled={items.length === 0}
                className="w-full mt-4 inline-flex items-center justify-center rounded-full bg-gray-900 text-white px-4 py-3 text-sm font-semibold hover:bg-black transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Checkout
              </button>
              <p className="mt-2 text-[11px] text-gray-500">
                Secure checkout powered by FounderX. Orders are fulfilled directly by startups.
              </p>
            </div>
          </div>
        )}
      </div>

      {showCheckout && checkoutItems.length > 0 && (
        <CheckoutModal
          items={checkoutItems}
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => {
            setShowCheckout(false);
            clearCart();
            router.push('/dashboard/user');
          }}
        />
      )}
    </div>
  );
}

