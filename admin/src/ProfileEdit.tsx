import { Edit, SimpleForm, TextInput } from 'react-admin';

export const ProfileEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" label="Name" fullWidth />
      <TextInput source="slug" label="Slug" fullWidth />
      <TextInput
        source="country"
        label="Country (alpha-2)"
        parse={(v) => (v ? String(v).toUpperCase() : v)}
        helperText="Two-letter country code, e.g., US"
      />
      <TextInput source="primary_color" label="Primary Color" type="color" />
    </SimpleForm>
  </Edit>
);
