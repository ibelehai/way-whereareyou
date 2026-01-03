import type React from 'react';
import { useState, useEffect } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';
import CloseIcon from '@mui/icons-material/Close';
import { useCreateStory } from '../hooks/useCreateStory';
import { alpha2ToName, countryOptions } from '../lib/countryCodes';

interface AddStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prefilledCountryCode?: string;
  prefilledCountryName?: string;
  prefilledAuthorCountryCode?: string;
  prefilledAuthorCountryName?: string;
  profileSlug?: string;
  defaultAccessCode?: string;
  onError?: (message: string) => void;
}

export function AddStoryModal({
  isOpen,
  onClose,
  onSuccess,
  prefilledCountryCode,
  prefilledCountryName,
  prefilledAuthorCountryCode,
  prefilledAuthorCountryName,
  profileSlug = 'public',
  defaultAccessCode,
  onError
}: AddStoryModalProps) {
  const getInitialState = () => ({
    accessCode: defaultAccessCode || '',
    authorCountryCode: prefilledAuthorCountryCode || '',
    authorCountryName: prefilledAuthorCountryName || '',
    countryCode: prefilledCountryCode || '',
    countryName: prefilledCountryName || '',
    authorName: '',
    story: ''
  });

  const [formData, setFormData] = useState(getInitialState());
  const [photoFile, setPhotoFile] = useState<File | undefined>();
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [showFullImage, setShowFullImage] = useState(false);
  const [error, setError] = useState<string>('');

  const { createStory, submitting } = useCreateStory();
  const countryFilter = createFilterOptions<{ code: string; name: string }>({
    stringify: (option) => `${option.name} ${option.code}`,
    matchFrom: 'any'
  });

  // Handle photo file selection and create preview
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoFile(undefined);
      setPhotoPreview('');
    }
  };

  // Update form when country is prefilled
  useEffect(() => {
    if (prefilledCountryCode && prefilledCountryName) {
      setFormData(prev => ({
        ...prev,
        countryCode: prev.countryCode || prefilledCountryCode,
        countryName: prev.countryName || prefilledCountryName
      }));
    }
    if (prefilledAuthorCountryCode && prefilledAuthorCountryName) {
      setFormData(prev => ({
        ...prev,
        authorCountryCode: prev.authorCountryCode || prefilledAuthorCountryCode,
        authorCountryName: prev.authorCountryName || prefilledAuthorCountryName
      }));
    }
    if (defaultAccessCode) {
      setFormData(prev => ({
        ...prev,
        accessCode: prev.accessCode || defaultAccessCode
      }));
    }
  }, [isOpen, prefilledCountryCode, prefilledCountryName, prefilledAuthorCountryCode, prefilledAuthorCountryName, defaultAccessCode]);

  // Reset when modal opens/closes to ensure fresh defaults
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleCountrySelect = (
    field: 'author' | 'story',
    option: { code: string; name: string } | null
  ) => {
    if (!option) return;
    if (field === 'author') {
      setFormData((prev) => ({
        ...prev,
        authorCountryCode: option.code,
        authorCountryName: option.name
      }));
      // If author country name empty, sync
      if (!formData.authorCountryName) {
        setFormData((prev) => ({ ...prev, authorCountryName: option.name }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        countryCode: option.code,
        countryName: option.name
      }));
      if (!formData.countryName) {
        setFormData((prev) => ({ ...prev, countryName: option.name }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await createStory(
      formData.accessCode,
      formData.authorCountryCode.toUpperCase() || formData.countryCode.toUpperCase(),
      formData.authorCountryName || formData.countryName,
      formData.countryCode.toUpperCase(),
      formData.countryName,
      formData.authorName,
      formData.story || null,
      photoFile,
      profileSlug
    );

    if (result.success) {
      resetForm();
      onClose();
      onSuccess();
    } else {
      const message = result.error || 'Failed to submit story';
      setError(message);
      onError?.(message);
    }
  };

  const resetForm = () => {
    setFormData(getInitialState());
    setPhotoFile(undefined);
    setPhotoPreview('');
    setShowFullImage(false);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={700}>Leave a story</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Stack spacing={2}>
              <Stack spacing={2}>
                <TextField
                  label="What is your name?"
                  placeholder="Your name"
                  value={formData.authorName}
                  onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                  required
                  inputProps={{ maxLength: 40 }}
                  fullWidth
                />

                <Autocomplete
                  options={countryOptions}
                  filterOptions={countryFilter}
                  isOptionEqualToValue={(opt, val) => opt.code === val.code}
                  value={
                    countryOptions.find(opt => opt.code === formData.authorCountryCode) ||
                    (formData.authorCountryCode && formData.authorCountryName
                      ? { code: formData.authorCountryCode, name: formData.authorCountryName }
                      : null)
                  }
                  onChange={(_, val) => handleCountrySelect('author', val)}
                  getOptionLabel={(opt) => `${opt.name} (${opt.code})`}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Where are you from?"
                      placeholder="Search or type"
                      required
                      onChange={(e) => {
                        const code = e.target.value.toUpperCase();
                        const name = alpha2ToName(code) || formData.authorCountryName;
                        setFormData((prev) => ({ ...prev, authorCountryCode: code, authorCountryName: name || '' }));
                      }}
                    />
                  )}
                />

                <Autocomplete
                  options={countryOptions}
                  filterOptions={countryFilter}
                  isOptionEqualToValue={(opt, val) => opt.code === val.code}
                  value={
                    countryOptions.find(opt => opt.code === formData.countryCode) ||
                    (formData.countryCode && formData.countryName
                      ? { code: formData.countryCode, name: formData.countryName }
                      : null)
                  }
                  onChange={(_, val) => handleCountrySelect('story', val)}
                  getOptionLabel={(opt) => `${opt.name} (${opt.code})`}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Where did your story happen?"
                      placeholder="Search or type"
                      required
                      onChange={(e) => {
                        const code = e.target.value.toUpperCase();
                        const name = alpha2ToName(code) || formData.countryName;
                        setFormData((prev) => ({ ...prev, countryCode: code, countryName: name || '' }));
                      }}
                    />
                  )}
                />
              </Stack>

              <TextField
                label="Tell the story"
                placeholder="Share your experience..."
                value={formData.story}
                onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                inputProps={{ maxLength: 500 }}
                multiline
                minRows={4}
                helperText={`${formData.story.length}/500`}
                fullWidth
              />

              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">Any image or a postcard?</Typography>
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" component="label">
                    Upload image
                    <input hidden type="file" accept="image/*" onChange={handlePhotoChange} />
                  </Button>
                  {photoPreview && (
                    <Button variant="text" color="error" onClick={() => { setPhotoFile(undefined); setPhotoPreview(''); }}>
                      Unattach image
                    </Button>
                  )}
                </Stack>
                {photoPreview && (
                  <Box
                    component="img"
                    src={photoPreview}
                    alt="Preview"
                    sx={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 2, cursor: 'pointer' }}
                    onClick={() => setShowFullImage(true)}
                  />
                )}
              </Stack>

              <TextField
                label="Access code"
                value={formData.accessCode}
                onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                required
                fullWidth
              />

              {error && <Alert severity="error">{error}</Alert>}

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button onClick={handleClose} variant="text">
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit'}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Full-size image modal */}
      {showFullImage && photoPreview && (
        <Dialog open onClose={() => setShowFullImage(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Photo preview</Typography>
            <IconButton onClick={() => setShowFullImage(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box
              component="img"
              src={photoPreview}
              alt="Full size preview"
              sx={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
