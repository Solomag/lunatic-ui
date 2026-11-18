# Third-party notices

Lunatic is MIT licensed (see `LICENSE`), except for the third-party work listed here, which
stays under its own license.

## vMohammad — @vmohammad/api (no license; reuse with credit permitted by the author)

`plugins/RemoteApi` is based on the `@vmohammad/api` plugin by vMohammad,
<https://github.com/vMohammad24/luna-plugins/tree/master/plugins/api> (commit `577f5e2`).
That repository has no license file. Its README marks it deprecated and asks anyone who
re-uploads its plugins to credit the original author and link back to the repository, which
this notice does. The original files were imported unchanged in the first commit of
`plugins/RemoteApi` and then changed (settings, network binding, token and Origin checks,
server restart and error handling). The MIT license of Lunatic does not apply to the parts
that come from the original plugin.

## FlazeIGuess (Victor Boiting) — Microsoft Public License (MS-PL)

Code adapted from Inrixia/TidaLuna#195 and #197 by FlazeIGuess, contributed to TidaLuna under
MS-PL. These portions remain under MS-PL:

- `plugins/LunaticUI/src/adaptive/tidal-icons.tsx` — TIDAL sprite icons (from `LunaIcon`)
- `plugins/LunaticUI/src/adaptive/preview-image.tsx` — preview image host check and opt-in download logic
- The state grouping in `plugins/LunaticUI/src/adaptive/Plugins.tsx` and the use of TIDAL `--wave-*` tokens follow his design.

```text
Microsoft Public License (Ms-PL)

This license governs use of the accompanying software. If you use the
software, you accept this license. If you do not accept the license,
do not use the software.

 1. Definitions

    The terms "reproduce," "reproduction," "derivative works," and
    "distribution" have the same meaning here as under U.S. copyright
    law.

    A "contribution" is the original software, or any additions or
    changes to the software.

    A "contributor" is any person that distributes its contribution
    under this license.

    "Licensed patents" are a contributor's patent claims that read
    directly on its contribution.

 2. Grant of Rights

    (A) Copyright Grant- Subject to the terms of this license,
    including the license conditions and limitations in section 3,
    each contributor grants you a non-exclusive, worldwide,
    royalty-free copyright license to reproduce its contribution,
    prepare derivative works of its contribution, and distribute its
    contribution or any derivative works that you create.
   
    (B) Patent Grant- Subject to the terms of this license, including
    the license conditions and limitations in section 3, each
    contributor grants you a non-exclusive, worldwide, royalty-free
    license under its licensed patents to make, have made, use, sell,
    offer for sale, import, and/or otherwise dispose of its
    contribution in the software or derivative works of the
    contribution in the software.
 
 3. Conditions and Limitations
  
    (A) No Trademark License- This license does not grant you rights
    to use any contributors' name, logo, or trademarks.

    (B) If you bring a patent claim against any contributor over
    patents that you claim are infringed by the software, your patent
    license from such contributor to the software ends automatically.

    (C) If you distribute any portion of the software, you must retain
    all copyright, patent, trademark, and attribution notices that are
    present in the software.

    (D) If you distribute any portion of the software in source code
    form, you may do so only under this license by including a
    complete copy of this license with your distribution. If you
    distribute any portion of the software in compiled or object code
    form, you may only do so under a license that complies with this
    license.  

    (E) The software is licensed "as-is." You bear the risk of using
    it. The contributors give no express warranties, guarantees, or
    conditions. You may have additional consumer rights under your
    local laws which this license cannot change. To the extent
    permitted under your local laws, the contributors exclude the
    implied warranties of merchantability, fitness for a particular
    purpose and non-infringement. 
```
