import { MessageCircle } from 'lucide-react';

const WA_NUMBER = import.meta.env.VITE_WHATSAPP_SUPPORT_NUMBER || '255700000000';
const WA_MESSAGE = encodeURIComponent('Hi! I need help with my order.');

export function WhatsAppFloat() {
  return (
    <a
      href={`https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] shadow-lg hover:bg-[#1ebe5d] hover:scale-110 transition-all duration-200"
    >
      <MessageCircle className="w-7 h-7 text-white fill-white" />
    </a>
  );
}
