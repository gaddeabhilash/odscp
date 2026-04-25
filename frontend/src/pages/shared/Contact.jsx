import { Card } from '../../components/ui/Card';
import { Phone, MessageCircle, Mail, MapPin, Clock } from 'lucide-react';

export default function Contact() {
  const supportLines = [
    { name: "Principal Support", phone: "9398801834", status: "Online" },
    { name: "Secondary Support", phone: "7993107169", status: "Active" }
  ];

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 md:px-0 animate-in fade-in duration-700">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">Connect with Team</h1>
        <p className="text-gray-500 mt-3 font-medium">Direct communication channels for immediate assistance and project queries.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {supportLines.map((contact, idx) => (
            <Card key={idx} className="p-8 border-gray-100 hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col justify-between h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-16 -mt-16 transition-all group-hover:bg-indigo-600 group-hover:scale-150 duration-500 opacity-50"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest group-hover:text-indigo-400">{contact.status}</p>
                </div>
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{contact.name}</h3>
                <p className="text-2xl font-black text-gray-900 mb-8">+91 {contact.phone}</p>
              </div>

              <div className="relative z-10 flex flex-col gap-3">
                <a 
                  href={`tel:${contact.phone}`}
                  className="w-full bg-gray-900 text-white py-4 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
                >
                  <Phone size={14} /> Voice Call
                </a>
                <a 
                  href={`https://wa.me/91${contact.phone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-emerald-500 text-white py-4 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
                >
                  <MessageCircle size={14} /> WhatsApp Direct
                </a>
              </div>
            </Card>
          ))}
        </div>

        {/* Office/Info Side Card */}
        <div className="space-y-6">
          <Card className="p-8 bg-indigo-600 text-white border-0 shadow-xl shadow-indigo-200">
            <h3 className="text-lg font-black uppercase tracking-tight mb-6">Operation Hours</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Clock className="mt-1 text-indigo-200" size={18} />
                <div>
                  <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Business Days</p>
                  <p className="text-sm font-bold mt-0.5">Mon — Sat: 9AM - 7PM</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Mail className="mt-1 text-indigo-200" size={18} />
                <div>
                  <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Email Support</p>
                  <p className="text-sm font-bold mt-0.5">support@odscp.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="mt-1 text-indigo-200" size={18} />
                <div>
                  <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Headquarters</p>
                  <p className="text-sm font-bold mt-0.5">Design Studio, Floor 4</p>
                </div>
              </div>
            </div>
          </Card>
          
          <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Team Note</p>
            <p className="text-xs text-gray-600 leading-relaxed italic">
              "We prioritize urgent site queries during working hours. For non-urgent documentation help, please allow up to 4 hours for a response."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
