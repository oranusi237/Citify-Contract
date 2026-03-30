import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { assets } from "../../assets";

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
    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0" />
    <div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-gray-500 text-sm mt-1">{text}</p>
    </div>
  </motion.div>
);

const Aboutsides = () => {
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
            <img src={assets.mission_img} alt="Our Mission" className="w-full h-full object-cover" />
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
            variants={slideRight}
            initial="hidden"
            whileInView="show"
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="w-full h-96 rounded-2xl overflow-hidden"
          >
            <img src={assets.story_img} alt="Our Story" className="w-full h-full object-cover" />
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Aboutsides;