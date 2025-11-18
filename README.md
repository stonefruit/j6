# J-6 Chord Sets

A mobile-first web app for browsing and exploring Roland AIRA Compact J-6 chord progressions. Designed to be a quick reference guide while using the J-6, replacing the need to flip through the manual.

**Live Demo:** [View on GitHub Pages](https://stonefruit.github.io/j6/)

## Why This Exists

The Roland J-6 comes with 100 pre-programmed chord sets spanning various genres, but finding the right one means scrolling through the device or checking the manual. This app makes it easy to:

- Browse all 100 chord sets instantly
- Filter by chord set number or genre
- See the exact notes and chord progressions
- Visualize chords on a keyboard display
- Use on your phone while playing the J-6

## Features

- **Mobile-First Design** - Optimized for phone screens so you can reference it while using your J-6
- **Search & Filter** - Find chord sets by number or filter by genre
- **Visual Chord Display** - See chord notes on a keyboard visualization
- **Genre Organization** - Browse by musical style (House, Techno, R&B, Jazz, etc.)
- **Expandable Cards** - Tap to reveal full chord progressions and note details
- **Responsive Layout** - Works on phones, tablets, and desktop

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/stonefruit/j6.git

# Navigate to the project directory
cd j6

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173/j6/`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **Search by Number** - Enter a chord set number (1-100) to jump directly to it
2. **Filter by Genre** - Use the dropdown to see all chord sets in a specific genre
3. **Expand a Card** - Click/tap any chord set card to see the full progression
4. **View Chord Details** - See the chord name, key, notes, and keyboard visualization

## Data Accuracy

The chord data in this app has been manually transcribed and may contain errors. If you find any inaccuracies:

- [Report an issue](https://github.com/stonefruit/j6/issues/new)
- Submit a pull request with corrections

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **CSS3** - Styling with responsive design

## Project Structure

```
j6/
├── src/
│   ├── components/
│   │   ├── ChordSets.tsx         # Main component with filtering
│   │   ├── Keyboard.tsx          # Piano keyboard visualization
│   │   ├── TriggerKey.tsx        # J-6 trigger key display
│   │   └── ChordPreviewKeyboard.tsx  # Preview keyboard
│   ├── types.ts                  # TypeScript type definitions
│   └── App.tsx                   # Root component
├── j6-chords.json                # Chord set data
└── package.json
```

## Contributing

Contributions are welcome! Whether it's:

- Fixing chord data errors
- Improving the UI/UX
- Adding new features
- Improving documentation

Please feel free to open an issue or submit a pull request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Roland Corporation for the AIRA Compact J-6
- All contributors who help improve the chord data accuracy

## Related Links

- [Roland J-6 Official Page](https://www.roland.com/us/products/j-6/)
- [J-6 Manual](https://www.roland.com/us/support/by_product/j-6/owners_manuals/)

---

Made with ♪ for J-6 users everywhere
