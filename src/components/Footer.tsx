'use client'

import { Github, Linkedin, Globe, Youtube } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const socialLinks = [
    {
      name: 'GitHub',
      url: 'https://github.com/CodingEnthusiastic',
      icon: Github,
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/in/rishabh-shenoy-3b3566286/',
      icon: Linkedin,
    },
    {
      name: 'Portfolio',
      url: 'https://shenoyrishabh.netlify.app/',
      icon: Globe,
    },
    {
      name: 'YouTube',
      url: 'https://www.youtube.com/@tenperformer',
      icon: Youtube,
    },
  ]

  const allPagesLinks = [
    { name: 'Home', url: '/' },
    { name: 'Learn', url: '/learn' },
    { name: 'Articles', url: '/articles' },
    { name: 'Quizzes', url: '/quizzes' },
    { name: 'Leaderboard', url: '/leaderboard' },
    { name: 'Profile', url: '/profile' },
  ]

  return (
    <footer className="relative border-t border-foreground/10 bg-background text-foreground">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* Brand Section */}
            <div className="md:col-span-1">
              <h3 className="text-2xl font-bold mb-4">Master System Design</h3>
              <p className="text-foreground/70 text-sm leading-relaxed mb-6">
                Learn high-level and low-level system design from fundamentals to advanced concepts. Master the art of designing systems that scale to millions.
              </p>
              
              {/* Social Media Links */}
              <div className="flex items-center gap-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={social.name}
                      href={social.url}
                      title={social.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-full border border-foreground/20 hover:border-foreground/50 hover:bg-foreground/5 transition-all duration-300"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  )
                })}
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-1">
              <h4 className="text-lg font-bold mb-6">All Pages</h4>
              <ul className="space-y-3">
                {allPagesLinks.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.url}
                      className="text-foreground/70 hover:text-foreground transition-colors duration-200 text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal & Info */}
            <div className="md:col-span-1">
              <h4 className="text-lg font-bold mb-6">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#terms"
                    className="text-foreground/70 hover:text-foreground transition-colors duration-200 text-sm"
                  >
                    Terms & Conditions
                  </a>
                </li>
                <li>
                  <a
                    href="#privacy"
                    className="text-foreground/70 hover:text-foreground transition-colors duration-200 text-sm"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#disclaimer"
                    className="text-foreground/70 hover:text-foreground transition-colors duration-200 text-sm"
                  >
                    Disclaimer
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="text-foreground/70 hover:text-foreground transition-colors duration-200 text-sm"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-foreground/10 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-foreground/60">
                © {currentYear} Master System Design. All rights reserved.
              </p>
              <p className="text-sm text-foreground/60">
                Designed & Built with <span className="text-red-500">♥</span> for Learners
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}