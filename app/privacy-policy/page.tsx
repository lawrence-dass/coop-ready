/**
 * Privacy Policy Page
 * Story 16.7: Create Full Marketing Landing Page
 *
 * Static privacy policy page accessible to all users.
 */

import Link from 'next/link';
import { ROUTES } from '@/lib/constants/routes';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy - SubmitSmart',
  description: 'Privacy Policy for SubmitSmart ATS Resume Optimizer',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto max-w-3xl px-4 py-12">
        {/* Back Link */}
        <Link
          href={ROUTES.HOME}
          className="mb-8 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Privacy Policy
        </h1>

        <p className="mt-4 text-gray-600">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="mt-8 space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              1. Introduction
            </h2>
            <p className="mt-2">
              Welcome to SubmitSmart (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We respect your privacy
              and are committed to protecting your personal data. This privacy policy
              explains how we collect, use, and protect your information when you use
              our ATS resume optimization service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              2. Information We Collect
            </h2>
            <p className="mt-2">We collect the following types of information:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>
                <strong>Resume Content:</strong> The text content of resumes you
                upload for optimization.
              </li>
              <li>
                <strong>Job Descriptions:</strong> Job descriptions you paste for
                analysis.
              </li>
              <li>
                <strong>Account Information:</strong> Email address and
                authentication data if you create an account.
              </li>
              <li>
                <strong>Usage Data:</strong> How you interact with our service
                (pages visited, features used).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              3. How We Use Your Information
            </h2>
            <p className="mt-2">We use your information to:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Provide ATS score analysis and optimization suggestions</li>
              <li>Store your resume library and optimization history</li>
              <li>Improve our AI models and service quality</li>
              <li>Communicate with you about your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              4. Data Security
            </h2>
            <p className="mt-2">
              We implement appropriate security measures to protect your personal
              data. Your resume content is encrypted in transit and at rest. We use
              industry-standard security practices and regularly review our security
              procedures.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              5. Data Retention
            </h2>
            <p className="mt-2">
              We retain your data for as long as your account is active or as needed
              to provide our services. You can delete your data at any time through
              your account settings. Anonymous session data is retained for 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              6. Your Rights
            </h2>
            <p className="mt-2">You have the right to:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your data</li>
              <li>Export your data</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              7. Third-Party Services
            </h2>
            <p className="mt-2">
              We use third-party AI services (Anthropic Claude) to power our
              optimization suggestions. Your resume content is sent to these services
              for processing but is not stored by them for training purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              8. Contact Us
            </h2>
            <p className="mt-2">
              If you have questions about this privacy policy or your data, please
              contact us at privacy@submitsmart.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
