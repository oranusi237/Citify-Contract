import { motion } from "framer-motion";
import { Check, Handshake, Headset, Quote, Scale, ShieldCheck, Sparkles } from "lucide-react";
import { assets } from "../../../assets";
import LazyImage from '../../../shared/components/LazyImage'

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const slideLeft = {
  hidden: { opacity: 0, x: -40 },
  show: { opacity: 1, x: 0 },
};

const slideRight = {
  hidden: { opacity: 0, x: 40 },
  show: { opacity: 1, x: 0 },
};

const Block = ({ title, text }) => (
  <motion.div variants={item} className="flex gap-4 items-start">
    <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center shrink-0">
      <Check size={18} className="text-white" strokeWidth={2.5} />
    </div>
    <div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-gray-500 text-sm mt-1">{text}</p>
    </div>
  </motion.div>
);

const Aboutsides = () => {
  const services = [
    {
      title: 'Property Sales',
      text: 'Verified land and property listings with transparent pricing and documentation support.',
    },
    {
      title: 'Inspection Scheduling',
      text: 'Flexible inspection coordination to help you evaluate options quickly and confidently.',
    },
    {
      title: 'Investment Advisory',
      text: 'Market-backed guidance on high-potential locations, pricing trends, and acquisition strategy.',
    },
    {
      title: 'Client Support',
      text: 'Responsive follow-up from enquiry to close, so every step of your purchase stays clear and organized.',
    },
  ]

  const coreValues = [
    {
      letter: 'A',
      icon: ShieldCheck,
      title: 'Accountability',
    },
    {
      letter: 'R',
      icon: Scale,
      title: 'Responsibility',
    },
    {
      letter: 'I',
      icon: Handshake,
      title: 'Integrity',
    },
    {
      letter: 'S',
      icon: Headset,
      title: 'Service',
    },
    {
      letter: 'E',
      icon: Sparkles,
      title: 'Excellence',
    },
  ]

  return (
    <div className="bg-white text-gray-900">
      <section className="py-20">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 grid md:grid-cols-2 gap-10 items-center"
        >
          <motion.div
            variants={item}
            className="w-full h-96 rounded-2xl overflow-hidden"
          >
            <LazyImage src={assets.mission_img} alt="Our Mission" className="w-full h-full object-cover" sizes='(max-width: 768px) 100vw, 50vw' />
          </motion.div>

          <div className="space-y-8">
            <Block
              title="Our Mission"
              text="To restore order and confidence to the real estate market by delivering structural excellence, innovative concepts, and fair, transparent pricing."
            />
            <Block
              title="Our Vision"
              text="To redefine the real estate experience through unwavering transparency and innovation, setting the gold standard for trusted, high-value investments and elevating modern living in an evolving market."
            />
          </div>
        </motion.div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 grid md:grid-cols-2 gap-10 items-center">
          <motion.div
            variants={slideLeft}
            initial="hidden"
            whileInView="show"
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Quote className="text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Our Story</h2>
            <h4 className="text-gray-500 mb-4">From idea to innovation</h4>
            <p className="text-gray-600">
              Founded in 2021 as Patriot Realtors, we began as a close-knit team of marketers with a single goal: to bridge the gap in professional service delivery within the real estate sector. By 2022, we evolved and officially registered as Citify. 
            </p>
          </motion.div>

          <motion.div
            initial={{ clipPath: 'inset(0% 100% 0% 0% round 1rem)' }}
            whileInView={{ clipPath: 'inset(0% 0% 0% 0% round 1rem)' }}
            transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
            viewport={{ once: true }}
            className="w-full h-96 rounded-2xl overflow-hidden"
          >
            <LazyImage src={assets.story_img} alt="Our Story" className="w-full h-full object-cover" sizes='(max-width: 768px) 100vw, 50vw' />
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={slideRight}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand/70">What We Offer</p>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">Our Services</h2>
            <p className="text-gray-600 mt-3 max-w-2xl">
              We provide end-to-end support designed to make property acquisition simpler, safer, and more rewarding.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {services.map((service) => (
              <motion.article
                key={service.title}
                variants={item}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold text-slate-900">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{service.text}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-375 mx-auto px-4 md:px-8 lg:px-10">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={slideRight}
            transition={{ duration: 0.7 }}
            className="rounded-3xl border border-brand/20 bg-linear-to-r from-brand/6 via-white to-brand/10 px-3 py-10 sm:px-5 md:px-7"
          >
            <div>
              <h2 className="text-center text-3xl md:text-4xl font-bold text-slate-900">Our Core <span className="text-brand">Values</span></h2>

              <motion.div
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3 md:flex md:flex-nowrap md:items-center md:justify-start lg:justify-center md:gap-x-8 md:overflow-x-auto md:pb-2"
              >
                {coreValues.map((value, index) => {
                  const Icon = value.icon
                  return (
                    <motion.div key={value.title} variants={item} className="flex items-center gap-3 rounded-xl border border-brand/20 bg-white/80 px-3 py-2 md:shrink-0 md:border-0 md:bg-transparent md:px-0 md:py-0">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand/40 bg-brand/10 text-brand">
                        <Icon size={19} strokeWidth={2.2} />
                      </div>
                      <p className="text-lg md:text-xl font-semibold tracking-tight whitespace-nowrap">
                        <span className="text-brand">{value.letter}</span>
                        <span className="text-slate-800"> - {value.title}</span>
                      </p>
                      {index < coreValues.length - 1 && (
                        <span className="hidden xl:inline-block h-6 w-px bg-slate-300 ml-2" aria-hidden="true" />
                      )}
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Aboutsides;