import { motion } from 'framer-motion';
import useStore from '../../store/useStore';

const galleryImages = [
  {
    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=400&fit=crop&fm=webp&q=80',
    alt: 'Rich chocolate truffle cake',
    label: 'Chocolate Truffle',
  },
  {
    url: 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?w=600&h=400&fit=crop&fm=webp&q=80',
    alt: 'Red velvet cake with cream cheese frosting',
    label: 'Red Velvet',
  },
  {
    url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&h=400&fit=crop&fm=webp&q=80',
    alt: 'Strawberry garden cake',
    label: 'Strawberry Garden',
  },
  {
    url: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=600&h=400&fit=crop&fm=webp&q=80',
    alt: 'Birthday celebration cake',
    label: 'Birthday Special',
  },
  {
    url: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=600&h=600&fit=crop&fm=webp&q=80',
    alt: 'Wedding anniversary cake',
    label: 'Anniversary',
  },
  {
    url: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=600&h=400&fit=crop&fm=webp&q=80',
    alt: 'Colorful cupcakes assortment',
    label: 'Cupcake Collection',
  },
  {
    url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&h=600&fit=crop&fm=webp&q=80',
    alt: 'Tiramisu tower dessert',
    label: 'Tiramisu Tower',
  },
  {
    url: 'https://images.unsplash.com/photo-1562777717-dc6984f65a63?w=600&h=400&fit=crop&fm=webp&q=80',
    alt: 'Rainbow sprinkle cake',
    label: 'Rainbow Delight',
  },
];

export default function GallerySection() {
  const { theme } = useStore();

  return (
    <section className={`py-20 transition-colors duration-500 ${theme === 'dark' ? 'bg-[#1A1110]' : 'bg-secondary'}`}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className={`font-heading text-3xl sm:text-4xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>
            📸 Our Creations
          </h2>
          <p className={`text-sm max-w-lg mx-auto ${theme === 'dark' ? 'text-white/50' : 'text-brown-400'}`}>
            Every cake is a masterpiece. Here's a glimpse of what we've crafted for our customers.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {galleryImages.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.03 }}
              className={`relative rounded-2xl overflow-hidden group cursor-pointer ${
                i === 4 ? 'row-span-2' : ''
              } ${i === 0 ? 'col-span-2 md:col-span-1' : ''}`}
            >
              <img
                src={img.url}
                alt={img.alt}
                className={`w-full object-cover transition-transform duration-700 group-hover:scale-110 ${
                  i === 4 ? 'h-full' : 'h-48 sm:h-56'
                }`}
                loading="lazy"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <div>
                  <p className="text-white font-bold text-sm">{img.label}</p>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Whisk Bakery</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
