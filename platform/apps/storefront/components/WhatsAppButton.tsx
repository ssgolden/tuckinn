"use client";

import { useEffect, useState } from "react";

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
}

export function WhatsAppButton({
  phoneNumber = "34627755609", // Your WhatsApp: +34 627 755 609
  message = "Hi! I'd like to place an order from TuckInn Proper."
}: WhatsAppButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show button after page load with slight delay
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Format phone number - remove + and spaces
  const formattedPhone = phoneNumber.replace(/[\+\s]/g, "");
  
  // WhatsApp click-to-chat URL
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

  if (!isVisible) return null;

  return (
    <>
      {/* Floating WhatsApp Badge */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="whatsapp-float"
      >
        {/* WhatsApp Icon */}
        <svg 
          viewBox="0 0 24 24" 
          fill="currentColor"
          className="whatsapp-icon"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-1.473-.484-1.473-.484l-.006.006c-.404.141-.772.418-1.01.771-.004.006-1.278 1.854-1.278 1.854-.143.215-.344.195-.344.195l-1.525-.043s-2.995-1.298-4.39-3.472C5.778 10.084 4.88 7.59 4.88 7.59s-.076-.209.013-.304c.089-.095.348-.105.348-.105l1.625.008s.306.04.509.234c.15.145.234.371.315.633.105.346.313 1.09.313 1.09s.3 1.025.7 1.95c.396.916.744 1.344.936 1.26.193-.084.295-.766.295-.766s.026-1.178.064-1.87c.038-.616-.024-.886-.102-1.08-.075-.185-.297-.267-.41-.295-.104-.024-.171-.041-.171-.041s.071-.085.188-.166c.117-.082.336-.16.623-.176.295-.017.666.016 1.092.067.426.05.99.18 1.466.474.476.293.973.82 1.23 1.476.256.656.405 1.488.405 1.488s.16 1.055-.022 1.482c-.18.426-.5.707-.5.707s-.38.289-.713.412c-.333.123-.595.18-.595.18l.003.006c.214.128.466.272.71.406.296.164.583.305.797.405.426.21 1.092.477 1.092.477s.476.215.695.36c.22.144.403.36.54.54.138.18.21.396.286.654.075.257.098.594.098.594s.027.39-.066.744c-.093.354-.276.68-.493.906-.217.226-.492.4-.777.54-.286.138-.607.227-.93.273-.324.046-.658.046-.98-.03-.322-.075-.637-.227-.903-.44-.265-.213-.483-.493-.603-.81-.12-.317-.144-.673-.067-.995.076-.322.27-.62.518-.84.247-.22.55-.363.863-.41.313-.047.635-.007.92.115.284.122.53.33.695.593l.003.004c.12.195.286.332.476.44.19.108.405.169.622.176.217.008.437-.032.628-.116.19-.084.352-.213.469-.377.117-.164.188-.357.204-.556.016-.198-.024-.4-.114-.576-.09-.176-.225-.323-.39-.426-.165-.104-.355-.169-.55-.188z" />
          <path d="M12 2C6.486 2 2 6.486 2 12c0 1.786.44 3.463 1.213 4.942L2.09 22l5.206-1.11A9.955 9.955 0 0012 22c5.514 0 10-4.486 10-10S17.514 2 12 2zm0 18c-1.65 0-3.18-.55-4.426-1.47l-.312-.222-3.094.658.663-3.015-.214-.338A8.01 8.01 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" />
        </svg>
      </a>

      {/* Styles */}
      <style jsx>{`
        .whatsapp-float {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          background-color: #25D366;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 9999;
          text-decoration: none;
          transition: all 0.3s ease;
          animation: whatsapp-float-in 0.5s ease-out;
        }

        .whatsapp-float:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
          background-color: #22c35e;
        }

        .whatsapp-float:active {
          transform: scale(0.95);
        }

        .whatsapp-icon {
          width: 28px;
          height: 28px;
          fill: white;
        }

        @keyframes whatsapp-float-in {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Pulse animation ring */
        .whatsapp-float::before {
          content: '';
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          border-radius: 50%;
          border: 2px solid #25D366;
          animation: whatsapp-pulse 2s infinite;
          opacity: 0;
        }

        @keyframes whatsapp-pulse {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.3);
            opacity: 0;
          }
        }

        /* Mobile adjustments */
        @media (max-width: 640px) {
          .whatsapp-float {
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
          }
          
          .whatsapp-icon {
            width: 24px;
            height: 24px;
          }
        }
      `}</style>
    </>
  );
}
