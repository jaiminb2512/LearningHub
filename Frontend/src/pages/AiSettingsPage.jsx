import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Slider,
  Snackbar,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  DeleteOutline as DeleteIcon,
  EditOutlined as EditIcon,
} from '@mui/icons-material';
import aiSettingService, { DEFAULT_AI_SETTINGS_FORM } from '../services/aiSettingService';
import aiService from '../services/aiService';
import { useHeaderActions } from '../components/sidebar/HeaderActionsContext';

const isSuccess = (response) => Number(response?.success) === 200 || Number(response?.success) === 201;

const AiSettingsPage = () => {
  const { setHeaderActions } = useHeaderActions();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({
    name: '',
    ...DEFAULT_AI_SETTINGS_FORM,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showToast = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const modelOptions = useMemo(() => {
    const list = [];
    providers.forEach((provider) => {
      (provider.models || []).forEach((model) => {
        list.push({
          providerId: provider.id,
          providerName: provider.name,
          modelId: model.id,
          modelName: model.name,
        });
      });
    });
    return list;
  }, [providers]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, providersRes] = await Promise.all([
        aiSettingService.getAll({ page: 1, limit: 100 }),
        aiService.getProviders(),
      ]);
      if (isSuccess(settingsRes)) {
        setSettings(settingsRes.data?.settings || []);
      }
      if (isSuccess(providersRes)) {
        setProviders(providersRes.data || []);
      }
    } catch (error) {
      showToast('Failed to load AI settings', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', ...DEFAULT_AI_SETTINGS_FORM });
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    const json = item.settingsJson || {};
    setEditing(item);
    setForm({
      name: item.name || '',
      temperature: json.temperature ?? DEFAULT_AI_SETTINGS_FORM.temperature,
      maxOutputTokens: json.maxOutputTokens ?? DEFAULT_AI_SETTINGS_FORM.maxOutputTokens,
      ragEnabled: json.ragEnabled !== false,
      model: json.model || DEFAULT_AI_SETTINGS_FORM.model,
      provider: json.provider || DEFAULT_AI_SETTINGS_FORM.provider,
    });
    setDialogOpen(true);
  };

  useEffect(() => {
    setHeaderActions(
      <Button
        variant="contained"
        size="small"
        startIcon={<AddIcon />}
        onClick={openCreate}
        sx={{ height: 38, px: 2, fontWeight: 600 }}
      >
        New setting
      </Button>
    );
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast('Settings name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        settingsJson: {
          temperature: Number(form.temperature),
          maxOutputTokens: Number(form.maxOutputTokens),
          ragEnabled: Boolean(form.ragEnabled),
          model: form.model,
          provider: form.provider,
        },
      };
      const response = editing
        ? await aiSettingService.update(editing.aiSettingId, payload)
        : await aiSettingService.create(payload);

      if (isSuccess(response)) {
        showToast(editing ? 'Setting updated' : 'Setting created');
        setDialogOpen(false);
        await load();
      } else {
        showToast(response?.message || 'Failed to save', 'error');
      }
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const response = await aiSettingService.delete(deleteTarget.aiSettingId);
      if (isSuccess(response)) {
        showToast('Setting deleted');
        setDeleteTarget(null);
        await load();
      } else {
        showToast(response?.message || 'Failed to delete', 'error');
      }
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to delete', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : settings.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            No AI settings yet. Create one to control temperature, tokens, RAG, and model.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            New setting
          </Button>
        </Box>
      ) : (
        <List sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1 }}>
          {settings.map((item) => {
            const json = item.settingsJson || {};
            return (
              <ListItem
                key={item.aiSettingId}
                secondaryAction={
                  <Box>
                    <IconButton edge="end" onClick={() => openEdit(item)} aria-label="edit">
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => setDeleteTarget(item)} aria-label="delete">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
                disablePadding
              >
                <ListItemButton onClick={() => openEdit(item)}>
                  <ListItemText
                    primary={item.name}
                    secondary={`Model: ${json.model || '—'} · Temp: ${json.temperature ?? '—'} · Tokens: ${json.maxOutputTokens ?? '—'} · RAG: ${json.ragEnabled === false ? 'Off' : 'On'}`}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      )}

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit AI setting' : 'New AI setting'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <TextField
            label="Settings name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            fullWidth
            required
            autoFocus
          />

          <FormControl fullWidth>
            <InputLabel id="model-label">Model</InputLabel>
            <Select
              labelId="model-label"
              label="Model"
              value={form.model}
              onChange={(e) => {
                const modelId = e.target.value;
                const match = modelOptions.find((m) => m.modelId === modelId);
                setForm((prev) => ({
                  ...prev,
                  model: modelId,
                  provider: match?.providerId || prev.provider,
                }));
              }}
            >
              {modelOptions.map((m) => (
                <MenuItem key={m.modelId} value={m.modelId}>
                  {m.providerName} — {m.modelName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Typography gutterBottom>
              Temperature: {Number(form.temperature).toFixed(2)}
            </Typography>
            <Slider
              min={0}
              max={2}
              step={0.05}
              value={Number(form.temperature)}
              onChange={(_, value) => setForm((prev) => ({ ...prev, temperature: value }))}
              valueLabelDisplay="auto"
            />
          </Box>

          <TextField
            label="Max output tokens"
            type="number"
            value={form.maxOutputTokens}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, maxOutputTokens: Number(e.target.value) || 0 }))
            }
            fullWidth
            inputProps={{ min: 64, max: 8192 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={Boolean(form.ragEnabled)}
                onChange={(e) => setForm((prev) => ({ ...prev, ragEnabled: e.target.checked }))}
              />
            }
            label="RAG enabled (store/search vectors)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => !saving && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete setting?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Delete “{deleteTarget?.name}”? Threads using it will fall back to defaults.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={saving}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={saving}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AiSettingsPage;
