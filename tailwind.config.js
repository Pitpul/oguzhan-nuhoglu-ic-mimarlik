/** Tailwind (v3) yapılandırması — marka renkleri ve fontları tek yerden. */
module.exports = {
  content: ['./views/**/*.ejs', './public/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        ivory: '#F5EDE0', // Açık Fildişi
        bone: '#FAF7F2', // Kemik
        charcoal: '#1A1917', // Antrasit
        bronze: {
          DEFAULT: '#9E7B56', // Bronz
          dark: '#7A5A3A', // Küçük yazılarda erişilebilir kontrast için
          light: '#B38F69'
        },
        muted: {
          DEFAULT: '#5C5852', // İkincil metin
          light: '#8A857D'
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif']
      },
      letterSpacing: {
        arch: '0.2em',
        'wide-arch': '0.3em'
      }
    }
  },
  plugins: []
};
