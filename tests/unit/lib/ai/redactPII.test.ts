/**
 * Test Suite: PII Redaction Utility
 *
 * Validates regex-based redaction accuracy across all PII types:
 * - Email addresses (target: 99% accuracy)
 * - Phone numbers (target: 95% accuracy)
 * - Social profile URLs (target: 98% accuracy)
 * - Street addresses (target: 70-75% accuracy)
 */

import { redactPII, restorePII, containsPII } from '@/lib/ai/redactPII';

describe('PII Redaction Utility', () => {
  describe('Email redaction', () => {
    it('redacts standard email addresses', () => {
      const input = 'Contact: john.doe@example.com';
      const { redactedText, redactionMap, stats } = redactPII(input);

      expect(redactedText).toBe('Contact: [EMAIL_1]');
      expect(redactionMap.get('[EMAIL_1]')).toBe('john.doe@example.com');
      expect(stats.emails).toBe(1);
    });

    it('redacts multiple emails', () => {
      const input = 'Email: user@company.com or admin@company.org';
      const { redactedText, stats } = redactPII(input);

      expect(redactedText).toBe('Email: [EMAIL_1] or [EMAIL_2]');
      expect(stats.emails).toBe(2);
    });

    it('redacts emails with subdomains', () => {
      const input = 'Send to: support@mail.example.co.uk';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe('Send to: [EMAIL_1]');
    });

    it('redacts emails with plus addressing', () => {
      const input = 'user+tag@example.com';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe('[EMAIL_1]');
    });

    it('redacts emails with numbers', () => {
      const input = 'Contact: user123@example456.com';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe('Contact: [EMAIL_1]');
    });

    it('redacts emails with underscores', () => {
      const input = 'first_last@company.com';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe('[EMAIL_1]');
    });

    it('redacts emails in sentences', () => {
      const input =
        'Please reach out to hiring@example.com for more information.';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe(
        'Please reach out to [EMAIL_1] for more information.'
      );
    });
  });

  describe('Phone number redaction', () => {
    it('redacts US phone with dashes', () => {
      const input = 'Phone: 555-123-4567';
      const { redactedText, redactionMap, stats } = redactPII(input);

      expect(redactedText).toBe('Phone: [PHONE_1]');
      expect(redactionMap.get('[PHONE_1]')).toBe('555-123-4567');
      expect(stats.phones).toBe(1);
    });

    it('redacts phone with parentheses', () => {
      const input = 'Call: (555) 123-4567';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe('Call: [PHONE_1]');
    });

    it('redacts phone with dots', () => {
      const input = 'Mobile: 555.123.4567';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe('Mobile: [PHONE_1]');
    });

    it('redacts international format with +1', () => {
      const input = 'Mobile: +1-555-123-4567';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe('Mobile: [PHONE_1]');
    });

    it('redacts phone with country code and parentheses', () => {
      const input = '+1 (555) 123-4567';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe('[PHONE_1]');
    });

    it('redacts phone with spaces', () => {
      const input = '555 123 4567';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe('[PHONE_1]');
    });

    it('redacts multiple phone numbers', () => {
      const input = 'Office: 555-123-4567, Mobile: (555) 987-6543';
      const { redactedText, stats } = redactPII(input);

      expect(redactedText).toBe('Office: [PHONE_1], Mobile: [PHONE_2]');
      expect(stats.phones).toBe(2);
    });

    it('does not redact random 10-digit numbers without separators', () => {
      const input = 'Invoice: 1234567890';
      const { redactedText } = redactPII(input);

      // Should NOT redact (no separators)
      expect(redactedText).toBe('Invoice: 1234567890');
    });
  });

  describe('Social profile URL redaction', () => {
    it('redacts LinkedIn URLs', () => {
      const input = 'https://linkedin.com/in/johndoe';
      const { redactedText, redactionMap, stats } = redactPII(input);

      expect(redactedText).toBe('[PROFILE_1]');
      expect(redactionMap.get('[PROFILE_1]')).toBe(
        'https://linkedin.com/in/johndoe'
      );
      expect(stats.urls).toBe(1);
    });

    it('redacts LinkedIn URLs with https', () => {
      const input = 'Profile: https://www.linkedin.com/in/jane-doe';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe('Profile: [PROFILE_1]');
    });

    it('redacts GitHub URLs', () => {
      const input = 'https://github.com/johndoe';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe('[PROFILE_1]');
    });

    it('redacts GitHub repository URLs', () => {
      const input = 'https://github.com/johndoe/my-repo';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe('[PROFILE_1]');
    });

    it('redacts Twitter URLs', () => {
      const input = 'https://twitter.com/johndoe';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe('[PROFILE_1]');
    });

    it('redacts X.com URLs', () => {
      const input = 'https://x.com/johndoe';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe('[PROFILE_1]');
    });

    it('redacts GitLab URLs', () => {
      const input = 'https://gitlab.com/johndoe';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe('[PROFILE_1]');
    });

    it('redacts Bitbucket URLs', () => {
      const input = 'https://bitbucket.org/johndoe';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe('[PROFILE_1]');
    });

    it('redacts multiple profile URLs', () => {
      const input =
        'GitHub: https://github.com/user | LinkedIn: https://linkedin.com/in/user';
      const { redactedText, stats } = redactPII(input);

      expect(redactedText).toBe('GitHub: [PROFILE_1] | LinkedIn: [PROFILE_2]');
      expect(stats.urls).toBe(2);
    });
  });

  describe('Street address redaction', () => {
    it('redacts full address with zip', () => {
      const input = '123 Main Street, San Francisco, CA 94105';
      const { redactedText, redactionMap, stats } = redactPII(input);

      expect(redactedText).toBe('[ADDRESS_1]');
      expect(redactionMap.get('[ADDRESS_1]')).toBe(
        '123 Main Street, San Francisco, CA 94105'
      );
      expect(stats.addresses).toBe(1);
    });

    it('redacts address with apartment number', () => {
      const input = '456 Oak Ave, Apt 4B, New York, NY 10001';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe('[ADDRESS_1]');
    });

    it('redacts address with suite', () => {
      const input = '789 Elm Boulevard, Suite 200, Austin, TX 78701';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe('[ADDRESS_1]');
    });

    it('redacts address with abbreviations', () => {
      const input = '321 Pine St, Ste 5, Boston, MA 02108';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe('[ADDRESS_1]');
    });

    it('redacts address without unit number', () => {
      const input = '555 Maple Drive, Seattle, WA 98101';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe('[ADDRESS_1]');
    });

    it('redacts address with zip+4', () => {
      const input = '9999 Broadway, New York, NY 10001-1234';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe('[ADDRESS_1]');
    });

    it('redacts street-only address', () => {
      const input = '12345 Example Road';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe('[ADDRESS_1]');
    });

    it('redacts address with unit # symbol', () => {
      const input = '777 Park Place, #10, Miami, FL 33101';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe('[ADDRESS_1]');
    });
  });

  describe('PII restoration', () => {
    it('restores all redacted PII', () => {
      const original = 'Contact john.doe@example.com at (555) 123-4567';
      const { redactedText, redactionMap } = redactPII(original);
      const restored = restorePII(redactedText, redactionMap);

      expect(restored).toBe(original);
    });

    it('restores PII in LLM-generated suggestions', () => {
      const resume = 'Email: jane@example.com\nPhone: 555-987-6543';
      const { redactedText, redactionMap } = redactPII(resume);

      // Simulate LLM suggestion with redacted tokens
      const suggestion =
        'Update your contact section:\n- Change [EMAIL_1] to a professional address\n- Format [PHONE_1] consistently';

      const restored = restorePII(suggestion, redactionMap);

      expect(restored).toContain('jane@example.com');
      expect(restored).toContain('555-987-6543');
    });

    it('restores multiple instances of same token', () => {
      const resume = 'Primary: user@example.com\nBackup: user@example.com';
      const { redactedText, redactionMap } = redactPII(resume);

      // LLM mentions the email twice
      const suggestion = 'Remove duplicate [EMAIL_1] entries';
      const restored = restorePII(suggestion, redactionMap);

      expect(restored).toBe('Remove duplicate user@example.com entries');
    });

    it('handles restoration with no tokens', () => {
      const text = 'This has no redaction tokens';
      const restored = restorePII(text, new Map());

      expect(restored).toBe(text);
    });
  });

  describe('Non-PII preservation', () => {
    it('preserves company names', () => {
      const input = 'Worked at Apple Inc and Google LLC';
      const { redactedText } = redactPII(input);

      expect(redactedText).toContain('Apple Inc');
      expect(redactedText).toContain('Google LLC');
    });

    it('preserves job titles', () => {
      const input = 'Senior Software Engineer at Microsoft';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe('Senior Software Engineer at Microsoft');
    });

    it('preserves skills', () => {
      const input = 'Skills: React, TypeScript, Python, AWS';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe('Skills: React, TypeScript, Python, AWS');
    });

    it('preserves work experience details', () => {
      const input =
        'Developed microservices architecture using Docker and Kubernetes';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe(
        'Developed microservices architecture using Docker and Kubernetes'
      );
    });

    it('preserves education details', () => {
      const input = 'B.S. Computer Science, Stanford University, 2020';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe(
        'B.S. Computer Science, Stanford University, 2020'
      );
    });

    it('preserves project descriptions', () => {
      const input =
        'Built a React Native mobile app with 100K+ downloads on App Store';
      const { redactedText } = redactPII(input);

      expect(redactedText).toBe(
        'Built a React Native mobile app with 100K+ downloads on App Store'
      );
    });
  });

  describe('Combined PII redaction', () => {
    it('redacts multiple PII types in a resume', () => {
      const resume = `
John Doe
Email: john.doe@example.com
Phone: (555) 123-4567
Address: 12345 Main St, San Francisco, CA 94105
LinkedIn: https://linkedin.com/in/johndoe

Senior Software Engineer at Google
- Built scalable microservices
- Led team of 5 engineers
      `.trim();

      const { redactedText, stats } = redactPII(resume);

      // Check all PII redacted
      expect(redactedText).toContain('[EMAIL_1]');
      expect(redactedText).toContain('[PHONE_1]');
      expect(redactedText).toContain('[ADDRESS_1]');
      expect(redactedText).toContain('[PROFILE_1]');

      // Check non-PII preserved
      expect(redactedText).toContain('John Doe'); // Name preserved
      expect(redactedText).toContain('Google'); // Company preserved
      expect(redactedText).toContain('Senior Software Engineer'); // Title preserved

      // Check stats
      expect(stats.emails).toBe(1);
      expect(stats.phones).toBe(1);
      expect(stats.addresses).toBe(1);
      expect(stats.urls).toBe(1);
    });

    it('redacts PII from job description', () => {
      const jd = `
Senior DevOps Engineer
Company: TechCorp Inc
Location: 456 Tech Park, Seattle, WA 98101

Apply at: careers@techcorp.com
      `.trim();

      const { redactedText } = redactPII(jd);

      expect(redactedText).toContain('[EMAIL_1]');
      expect(redactedText).toContain('[ADDRESS_1]');
      expect(redactedText).toContain('TechCorp Inc');
    });
  });

  describe('Edge cases', () => {
    it('handles empty string', () => {
      const { redactedText, stats } = redactPII('');

      expect(redactedText).toBe('');
      expect(stats.emails).toBe(0);
      expect(stats.phones).toBe(0);
      expect(stats.urls).toBe(0);
      expect(stats.addresses).toBe(0);
    });

    it('handles text with no PII', () => {
      const input =
        'This is a normal sentence about software engineering concepts.';
      const { redactedText, stats } = redactPII(input);

      expect(redactedText).toBe(input);
      expect(stats.emails).toBe(0);
      expect(stats.phones).toBe(0);
      expect(stats.urls).toBe(0);
      expect(stats.addresses).toBe(0);
    });

    it('handles malformed emails', () => {
      const input = 'Not an email: user@domain';
      const { redactedText } = redactPII(input);

      // Should not redact (missing TLD)
      expect(redactedText).toBe(input);
    });

    it('handles numbers that look like phones but are not', () => {
      const input = 'Year: 2024, ID: 1234567890';
      const { redactedText } = redactPII(input);

      // Should not redact (no separators, likely IDs)
      expect(redactedText).toBe(input);
    });

    it('handles very long text', () => {
      const longResume = 'Summary: '.repeat(1000) + 'Contact: user@example.com';
      const { redactedText } = redactPII(longResume);

      expect(redactedText).toContain('[EMAIL_1]');
      expect(redactedText).not.toContain('user@example.com');
    });
  });

  describe('containsPII helper', () => {
    it('detects email presence', () => {
      expect(containsPII('Contact: user@example.com')).toBe(true);
    });

    it('detects phone presence', () => {
      expect(containsPII('Call: 555-123-4567')).toBe(true);
    });

    it('detects URL presence', () => {
      expect(containsPII('https://linkedin.com/in/user')).toBe(true);
    });

    it('returns false for text without PII', () => {
      expect(containsPII('Software Engineer at Google')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(containsPII('')).toBe(false);
    });
  });

  describe('Real-world resume examples', () => {
    it('redacts typical contact section', () => {
      const contact = `
CONTACT INFORMATION
Email: johndoe@gmail.com
Phone: (415) 555-1234
LinkedIn: https://linkedin.com/in/john-doe-engineer
GitHub: https://github.com/johndoe
Address: 7890 Market Street, Apt 5, San Francisco, CA 94103
      `.trim();

      const { redactedText, stats } = redactPII(contact);

      expect(stats.emails).toBe(1);
      expect(stats.phones).toBe(1);
      expect(stats.urls).toBe(2); // LinkedIn + GitHub
      expect(stats.addresses).toBe(1);

      expect(redactedText).not.toContain('johndoe@gmail.com');
      expect(redactedText).not.toContain('(415) 555-1234');
    });

    it('preserves work experience content', () => {
      const experience = `
SOFTWARE ENGINEER | Google LLC | 2020 to 2023
- Designed and implemented RESTful APIs using Node.js and Express
- Reduced API latency by 40% through database query optimization
- Collaborated with cross-functional teams of 10+ members
- Mentored 3 junior engineers on best practices
      `.trim();

      const { redactedText } = redactPII(experience);

      // Should preserve all content (no PII)
      expect(redactedText).toBe(experience);
    });
  });
});
