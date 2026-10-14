import { Box, Button, Stack, Typography } from '@mui/material';
import { ImageUp, Pencil, Play, Sparkles } from 'lucide-react';
import type { DrawingProject } from '../../projects/types';

type Props = {
  lastProject: DrawingProject | null;
  drawingCount: number;
  onStart: () => void;
  onContinue: () => void;
  onImport: () => void;
};

function greetingMoment(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Belle matinée pour dessiner';
  if (hour < 18) return 'Une petite pause créative ?';
  return 'Un dessin avant de dormir ?';
}

export default function HomeHero({ lastProject, drawingCount, onStart, onContinue, onImport }: Props) {
  return (
    <>
      <Box component="nav" className="eva-topbar rise" style={{ ['--i' as string]: 0 }}>
        <span className="eva-avatar" aria-hidden>
          <span>E</span>
        </span>
        <span className="eva-handle">
          <strong>eva.dessine</strong>
          <small>{greetingMoment()}</small>
        </span>
        <span className="eva-stat">
          <strong>{drawingCount}</strong>
          <small>dessin{drawingCount > 1 ? 's' : ''}</small>
        </span>
      </Box>

      <Box component="header" className="eva-hero rise" style={{ ['--i' as string]: 1 }}>
        <span className="eva-blob eva-blob-1" aria-hidden />
        <span className="eva-blob eva-blob-2" aria-hidden />
        <Box className="eva-hero-copy">
          <Typography className="eva-kicker">
            <Sparkles size={14} aria-hidden /> TON CARNET D’ANATOMIE
          </Typography>
          <Typography variant="h1" className="eva-title">
            Bonjour Eva,
            <br />
            <span className="eva-title-accent">on dessine quoi aujourd’hui&nbsp;?</span>
          </Typography>
          <Typography className="eva-subtitle">
            Observe, fais tourner, croque le corps humain — à ton rythme, juste pour toi.
          </Typography>
          <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1.25} sx={{ mt: 3.5 }}>
            <Button
              className="eva-cta shine"
              size="large"
              startIcon={lastProject ? <Play size={19} /> : <Pencil size={19} />}
              onClick={lastProject ? onContinue : onStart}
            >
              {lastProject ? 'Reprendre mon dernier dessin' : 'Commencer un dessin'}
            </Button>
            <Button className="eva-cta-ghost" size="large" startIcon={<ImageUp size={19} />} onClick={onImport}>
              Importer une illustration
            </Button>
          </Stack>
        </Box>
        <Box className="eva-hero-visual" aria-hidden>
          <span className="eva-halo" />
          <span className="eva-post">
            <span className="eva-post-head">
              <span className="eva-post-avatar">E</span>
              <strong>eva.dessine</strong>
            </span>
            <img src={`${import.meta.env.BASE_URL}anatomy3d/heart-apercu.png`} alt="" />
            <span className="eva-post-foot">
              <span className="eva-post-like">♥</span> Le cœur, à 360°
            </span>
          </span>
          <span className="sparkle s1">✦</span>
          <span className="sparkle s2">✦</span>
          <span className="sparkle s3">✧</span>
          <span className="sparkle s4">♥</span>
          <span className="eva-note">Observer · tourner · dessiner</span>
        </Box>
      </Box>
    </>
  );
}
