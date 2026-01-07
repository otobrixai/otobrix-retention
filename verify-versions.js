// verify-versions.js
const pkg = require('./package.json');

console.info('🔍 Checking security patch status...\n');

const current = {
  'next': pkg.dependencies.next,
  'react': pkg.dependencies.react,
  'react-dom': pkg.dependencies['react-dom'],
  '@sentry/nextjs': pkg.dependencies['@sentry/nextjs'],
  'next-auth': pkg.dependencies['next-auth'],
  '@prisma/client': pkg.dependencies['@prisma/client']
};

const required = {
  'next': '15.0.5',
  'react': '19.2.3', 
  'react-dom': '19.2.3',
  '@sentry/nextjs': '10.30.0',
  'next-auth': '5.0.0',
  '@prisma/client': '7.1.0'
};

Object.entries(current).forEach(([pkg, version]) => {
  const cleanVer = version?.replace(/[\^~>=]/g, '');
  const req = required[pkg];
  
  console.info(`${pkg}: ${version || 'MISSING'} ${cleanVer >= req ? '✅' : '❌'}`);
});

console.info('\nRun: npm install react@19.2.3 react-dom@19.2.3 @sentry/nextjs@10.30.0 next-auth@5.0.0 @prisma/client@7.1.0');