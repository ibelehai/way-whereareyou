import { useMemo } from 'react';
import { Box, Button, Stack, Typography, Link as MuiLink } from '@mui/material';
import QRCode from 'qrcode.react';
import { Create, Datagrid, List, NumberField, NumberInput, SimpleForm, TextField, TextInput, Show, SimpleShowLayout, FunctionField, useRecordContext } from 'react-admin';
import { getStoredProfile } from './authProvider';

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const siteUrl = import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin;
const storedProfile = getStoredProfile();
const profileSlug = storedProfile?.slug || 'public';

function resolveLink(record: any) {
  const code = record?.code;
  if (!code) return null;
  return record?.link_url || `${siteUrl}/places/${profileSlug}?code=${code}`;
}

export const AccessCodeList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="code" label="Code" />
      <NumberField source="usage_count" label="Used" />
      <NumberField source="usage_limit" label="Limit" />
      <TextField source="is_active" label="Active" />
      <TextField source="expires_at" label="Expires At" />
      <TextField source="created_at" label="Created" />
      <TextField source="link_url" label="Link" />
      <FunctionField label="QR" render={(record) => <QRCodeField record={record} />} />
    </Datagrid>
  </List>
);

export const AccessCodeShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="code" label="Code" />
      <NumberField source="usage_count" label="Used" />
      <NumberField source="usage_limit" label="Limit" />
      <TextField source="is_active" label="Active" />
      <TextField source="expires_at" label="Expires At" />
      <TextField source="created_at" label="Created" />
      <TextField source="link_url" label="Link" />
      <QRCodeDisplay />
    </SimpleShowLayout>
  </Show>
);

const QRCodeField = (props: any) => {
  const record = props.record || useRecordContext(props);
  const link = resolveLink(record);
  if (!link) return null;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start', py: 1 }}>
      <QRCode value={link} size={64} />
      <Button size="small" variant="outlined" onClick={() => navigator.clipboard?.writeText(link)}>
        Copy link
      </Button>
    </Box>
  );
};

const QRCodeDisplay = (props: any) => {
  const record = props.record || useRecordContext(props);
  const link = resolveLink(record);
  if (!link) return null;
  return (
    <Stack spacing={1} sx={{ py: 1 }}>
      <Typography variant="subtitle2">Share link</Typography>
      <MuiLink href={link} target="_blank" rel="noreferrer">
        {link}
      </MuiLink>
      <QRCode value={link} size={180} />
      <Button variant="outlined" onClick={() => navigator.clipboard?.writeText(link)}>
        Copy link
      </Button>
    </Stack>
  );
};

export const AccessCodeCreate = () => {
  const defaultCode = useMemo(() => generateCode(), []);
  const stored = getStoredProfile();
  const slug = stored?.slug || 'public';

  const defaultLink = `${siteUrl}/places/${slug}?code=${defaultCode}`;

  return (
    <Create>
      <SimpleForm defaultValues={{ code: defaultCode, usage_limit: 1, link_url: defaultLink }}>
        <TextInput source="code" label="Code" required parse={(v) => (v ? String(v).toUpperCase() : v)} />
        <NumberInput source="usage_limit" label="Usage limit" min={1} helperText="How many times this code can be used" required />
        <Typography variant="body2" sx={{ mt: 1, mb: 1 }}>
          Shareable link and QR will be stored with this code.
        </Typography>
      </SimpleForm>
    </Create>
  );
};
