// Where the ads' renders go: outside the tree, like the listing's (design/play-listing/lib.mjs). They are
// generated and carry card art, which is never committed (landmines 26, 28). ADS_OUT overrides it; the
// Python scripts read the same variable.
import path from 'node:path';
import { REPO } from '../play-listing/lib.mjs';
export const ADS_DIR = process.env.ADS_OUT || path.join(path.dirname(REPO), 'ads-build');
