import React from 'react'
import { Link } from 'react-router-dom'
import SitePageLayout from '../shared/components/SitePageLayout'
import { COMPANY, PRIVACY_POLICY_EFFECTIVE_DATE } from '../shared/config/siteConfig'

const Section = ({ title, children }) => (
  <section className='mb-10'>
    <h2 className='text-lg font-semibold text-slate-900 mb-3 border-l-4 border-brand pl-4'>{title}</h2>
    <div className='text-slate-600 leading-relaxed space-y-3 pl-4'>{children}</div>
  </section>
)

const PrivacyPolicyPage = () => {
  return (
    <SitePageLayout className='w-full overflow-hidden bg-slate-50' contentAs='main'>
        {/* Hero */}
        <section className='relative overflow-hidden bg-[linear-gradient(135deg,var(--color-brand-ink)_0%,var(--color-brand-deep)_55%,var(--color-brand)_100%)] text-white'>
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(109,255,178,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.1),transparent_24%)]' />
          <div className='relative mx-auto max-w-7xl px-6 py-16 md:px-12 lg:px-20 lg:py-20'>
            <p className='mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-brand-accent'>Legal</p>
            <h1 className='text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl'>Privacy Policy</h1>
            <p className='mt-3 text-white/75 text-sm'>Effective date: {PRIVACY_POLICY_EFFECTIVE_DATE}</p>
          </div>
        </section>

        {/* Body */}
        <div className='mx-auto max-w-4xl px-6 py-14 md:px-10'>
          <div className='rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-[0_10px_40px_rgba(15,23,42,0.06)] sm:px-12'>

            <p className='text-slate-600 leading-relaxed mb-10'>
              {COMPANY.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is committed to protecting your personal information and your right to privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or contact us regarding our real estate services.
              Please read this policy carefully. If you disagree with its terms, please discontinue use of the site.
            </p>

            <Section title='1. Information We Collect'>
              <p>We may collect the following categories of personal information:</p>
              <ul className='list-disc pl-5 space-y-1'>
                <li><strong>Contact data</strong> — name, email address, phone number, and any message content you provide via our contact or inspection-request forms.</li>
                <li><strong>Usage data</strong> — browser type, IP address, pages visited, and time spent on pages, collected automatically via analytics tools.</li>
                <li><strong>Device data</strong> — device type, operating system, and screen resolution for performance optimisation.</li>
              </ul>
              <p>We do <strong>not</strong> knowingly collect sensitive personal data (e.g. financial account numbers, government ID numbers) through this website.</p>
            </Section>

            <Section title='2. How We Use Your Information'>
              <p>We use the information we collect to:</p>
              <ul className='list-disc pl-5 space-y-1'>
                <li>Respond to enquiries and process inspection or consultation requests.</li>
                <li>Send administrative communications (e.g. confirmation of form submission).</li>
                <li>Improve the functionality and content of our website.</li>
                <li>Analyse usage trends to optimise user experience.</li>
                <li>Comply with applicable laws and regulations.</li>
              </ul>
              <p>We do <strong>not</strong> sell, rent, or trade your personal information to third parties for marketing purposes.</p>
            </Section>

            <Section title='3. Legal Basis for Processing'>
              <p>Where applicable, we process your personal data on the following legal bases:</p>
              <ul className='list-disc pl-5 space-y-1'>
                <li><strong>Consent</strong> — when you submit a form and tick the consent checkbox.</li>
                <li><strong>Legitimate interests</strong> — for website analytics and fraud prevention.</li>
                <li><strong>Legal obligation</strong> — where processing is necessary to comply with a legal duty.</li>
              </ul>
            </Section>

            <Section title='4. Disclosure of Your Information'>
              <p>We may share your data with trusted third-party providers who assist in operating our website and delivering our services, including:</p>
              <ul className='list-disc pl-5 space-y-1'>
                <li><strong>Google Firebase / Firestore</strong> — for secure database storage of contact and inspection requests.</li>
                <li><strong>Supabase</strong> — for media file storage.</li>
                <li><strong>EmailJS</strong> — to deliver notification emails.</li>
              </ul>
              <p>These partners are contractually obligated to keep your data confidential and use it only for the services they provide to us.</p>
              <p>We may also disclose your information if required to do so by law or in response to valid requests by public authorities.</p>
            </Section>

            <Section title='5. Data Retention'>
              <p>
                We retain contact and inspection request data for up to <strong>24 months</strong> from the date of submission, or until you request deletion, whichever comes first.
                After this period, data is deleted or anonymised.
              </p>
            </Section>

            <Section title='6. Cookies & Tracking'>
              <p>
                Our website may use cookies or similar tracking technologies to enhance your experience. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                Note that some features of the site may not function properly without cookies.
              </p>
            </Section>

            <Section title='7. Security'>
              <p>
                We implement industry-standard technical and organisational security measures to protect your personal information against unauthorised access, alteration, disclosure, or destruction.
                However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </Section>

            <Section title="8. Children's Privacy">
              <p>
                Our website is not directed to individuals under the age of 18. We do not knowingly collect personal information from children.
                If you believe we have inadvertently collected such information, please contact us immediately.
              </p>
            </Section>

            <Section title='9. Your Rights'>
              <p>Depending on your jurisdiction, you may have the right to:</p>
              <ul className='list-disc pl-5 space-y-1'>
                <li>Access the personal data we hold about you.</li>
                <li>Request correction of inaccurate data.</li>
                <li>Request deletion of your data.</li>
                <li>Object to or restrict processing of your data.</li>
                <li>Withdraw consent at any time (where processing is based on consent).</li>
              </ul>
              <p>To exercise any of these rights, please contact us using the details below.</p>
            </Section>

            <Section title='10. Third-Party Links'>
              <p>
                Our website may contain links to third-party websites. We have no control over and assume no responsibility for the content or privacy practices of those sites.
                We encourage you to review the privacy policy of any third-party site you visit.
              </p>
            </Section>

            <Section title='11. Changes to This Policy'>
              <p>
                We may update this Privacy Policy from time to time. The effective date at the top of this page will reflect the date of the most recent revision.
                We encourage you to review this policy periodically to stay informed about how we protect your information.
              </p>
            </Section>

            <Section title='12. Contact Us'>
              <p>If you have questions, concerns, or requests regarding this Privacy Policy, please reach out to us:</p>
              <div className='mt-3 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm space-y-1'>
                <p><strong>{COMPANY.name}</strong></p>
                <p>{COMPANY.address}</p>
                <p>Email: <a href={`mailto:${COMPANY.email}`} className='text-brand hover:underline'>{COMPANY.email}</a></p>
              </div>
            </Section>

            <div className='mt-10 pt-8 border-t border-slate-200 flex flex-wrap gap-3'>
              <Link to='/' className='inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-strong'>
                Back to Home
              </Link>
              <Link to='/contact' className='inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'>
                Contact Us
              </Link>
            </div>
          </div>
        </div>
    </SitePageLayout>
  )
}

export default PrivacyPolicyPage