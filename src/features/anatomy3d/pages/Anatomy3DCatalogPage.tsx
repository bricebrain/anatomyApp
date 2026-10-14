import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  IconButton,
  Typography,
} from '@mui/material';
import { ArrowLeft, Box as BoxIcon, Move3d } from 'lucide-react';
import { navigate } from '../../../app/router';
import { assets3d, previewImageUrl } from '../../anatomy/data/assets3d';
import '../../../styles/viewer3d.css';

export default function Anatomy3DCatalogPage() {
  return (
    <Box className="page viewer-catalog-page">
      <header className="viewer-catalog-header">
        <IconButton className="back-btn" onClick={() => navigate('/')} aria-label="Retour à l’accueil">
          <ArrowLeft size={22} />
        </IconButton>
        <Box>
          <Typography className="page-kicker">EXPLORATION À 360°</Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: '2rem', sm: '2.7rem' } }}>
            Regarde l’anatomie autrement
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 660, lineHeight: 1.65 }}>
            Fais tourner chaque modèle du bout du doigt, choisis ton angle puis envoie cette vue
            directement dans l’atelier de dessin.
          </Typography>
        </Box>
      </header>

      <div className="viewer-catalog-grid">
        {assets3d.map((asset) => {
          const preview = previewImageUrl(asset);
          return (
            <Card key={asset.id} className="viewer-catalog-card">
              <CardActionArea onClick={() => navigate(`/modeles3d/${asset.id}`)} sx={{ height: '100%' }}>
                <Box className="viewer-catalog-image">
                  {preview ? <img src={preview} alt={`Aperçu 3D — ${asset.label}`} /> : <BoxIcon size={42} />}
                  <Chip icon={<Move3d size={15} />} label="360°" size="small" className="viewer-360-chip" />
                </Box>
                <CardContent sx={{ p: 2.25 }}>
                  <Typography variant="h2" sx={{ fontSize: '1.35rem' }}>{asset.label}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.55 }}>
                    {asset.description}
                  </Typography>
                  <Typography color="primary" sx={{ mt: 2, fontWeight: 700 }}>
                    Explorer le modèle →
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </div>
    </Box>
  );
}
