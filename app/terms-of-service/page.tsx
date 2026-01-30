/**
 * Terms of Service Page
 * Story 16.7: Create Full Marketing Landing Page
 *
 * Static terms of service page accessible to all users.
 */

import Link from 'next/link';
import { ROUTES } from '@/lib/constants/routes';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service - SubmitSmart',
  description: 'Terms of Service for SubmitSmart ATS Resume Optimizer',
};

export default function TermsOfServicePage() {
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
          Terms of Service
        </h1>

        <p className="mt-4 text-gray-600">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="mt-8 space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              1. Acceptance of Terms
            </h2>
            <p className="mt-2">
              By accessing or using SubmitSmart (&quot;the Service&quot;), you agree to be
              bound by these Terms of Service. If you do not agree to these terms,
              please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              2. Description of Service
            </h2>
            <p className="mt-2">
              SubmitSmart is an ATS (Applicant Tracking System) resume optimization
              service. We analyze your resume against job descriptions and provide
              AI-powered suggestions to improve your chances of passing ATS filters.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              3. User Accounts
            </h2>
            <p className="mt-2">
              You may use the Service anonymously or create an account. If you create
              an account, you are responsible for maintaining the security of your
              account credentials. You must provide accurate information when
              registering.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              4. Acceptable Use
            </h2>
            <p className="mt-2">You agree not to:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>Upload malicious content or attempt to compromise the Service</li>
              <li>
                Share false or misleading information in your resume
              </li>
              <li>Attempt to reverse engineer or copy our technology</li>
              <li>Use automated tools to access the Service without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              5. Intellectual Property
            </h2>
            <p className="mt-2">
              You retain all rights to your resume content. By using the Service, you
              grant us a limited license to process your content for the purpose of
              providing optimization suggestions. We do not claim ownership of your
              resume content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              6. Disclaimer of Warranties
            </h2>
            <p className="mt-2">
              The Service is provided &quot;as is&quot; without warranties of any kind. We do
              not guarantee that our suggestions will result in job interviews or
              employment. ATS systems vary by company, and results may differ.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              7. Limitation of Liability
            </h2>
            <p className="mt-2">
              To the maximum extent permitted by law, SubmitSmart shall not be liable
              for any indirect, incidental, special, or consequential damages arising
              from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              8. Changes to Terms
            </h2>
            <p className="mt-2">
              We may update these Terms of Service from time to time. We will notify
              users of significant changes via email or through the Service.
              Continued use of the Service after changes constitutes acceptance of
              the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              9. Termination
            </h2>
            <p className="mt-2">
              We reserve the right to suspend or terminate your access to the Service
              at any time for violation of these terms or for any other reason at our
              discretion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              10. Contact Us
            </h2>
            <p className="mt-2">
              If you have questions about these Terms of Service, please contact us
              at support@submitsmart.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
