import { motion } from "framer-motion";
import {
  FaBriefcase,
  FaLayerGroup,
  FaLightbulb,
  FaShieldAlt,
  FaHandshake,
  FaBullseye,
} from "react-icons/fa";

const reasons = [
  {
    title: "5+ Years of Experience",
    description:
      "Proven expertise delivering high-quality property solutions with consistent results.",
    icon: FaBriefcase,
  },
  {
    title: "Multi-Sector Expertise",
    description:
      "Extensive experience across residential, commercial, and investment properties.",
    icon: FaLayerGroup,
  },
  {
    title: "Innovation-Driven",
    description:
      "Leveraging modern technology to simplify and enhance the property experience.",
    icon: FaLightbulb,
  },
  {
    title: "Integrity & Trust",
    description:
      "Transparency and honesty are at the core of every partnership we build.",
    icon: FaShieldAlt,
  },
  {
    title: "Reliable Partnerships",
    description:
      "We focus on long-term collaborations that foster growth and success.",
    icon: FaHandshake,
  },
  {
    title: "Impact-Focused",
    description:
      "Every solution is crafted to deliver measurable and meaningful results.",
    icon: FaBullseye,
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const Card = ({ title, description, icon: Icon }) => (
  <motion.div
    variants={cardVariants}
    className="relative rounded-2xl p-6 bg-white/10 border border-white/15 hover:border-brand/40 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-brand/10"
  >
    <div className="mb-4 text-brand text-3xl">
      <Icon />
    </div>
    <h3 className="text-lg font-semibold text-white mb-2 tracking-wide">{title}</h3>
    <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
  </motion.div>
);

const WhyChooseUs = () => (
  <section className="bg-white py-16 px-6 w-full" id="why-choose-us">
    <div className="max-w-7xl mx-auto rounded-4xl border border-slate-800 bg-slate-900 px-6 py-12 text-center shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:px-8 md:px-10 md:py-14">
      <div className="mb-12">
        <span className="inline-block text-sm text-brand bg-brand/10 px-4 py-1 rounded-full tracking-wide mb-4">Reasons</span>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why Choose Us?</h2>
        <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">We combine experience, innovation, and reliability to deliver exceptional real estate solutions that drive growth and long-term value.</p>
      </div>
      <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {reasons.map((item, index) => (<Card key={index} {...item} />))}
      </motion.div>
    </div>
  </section>
);

export default WhyChooseUs;
