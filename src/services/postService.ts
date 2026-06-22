import { api } from './api';

export const postService = {
  /** POST /uploads/image — sube una foto a Cloudinary, devuelve url + publicId */
  subirFoto: async (uri: string): Promise<{ url: string; publicId?: string }> => {
    const form = new FormData();
    const name = uri.split('/').pop() || 'post.jpg';
    const ext = (name.split('.').pop() || 'jpg').toLowerCase();
    const type = ext === 'png' ? 'image/png' : 'image/jpeg';
    form.append('image', { uri, name, type } as any);
    form.append('folder', 'posts');
    const res = await api.post('/uploads/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { url: res.data?.data?.url, publicId: res.data?.data?.publicId };
  },

  /** POST /jugador/posts — crea la publicación */
  crear: async (payload: { texto?: string; fotoUrl?: string; fotoPublicId?: string }) => {
    const res = await api.post('/jugador/posts', payload);
    return res.data;
  },

  /** DELETE /jugador/posts/:id — borra una publicación propia */
  eliminar: async (id: string) => {
    const res = await api.delete(`/jugador/posts/${id}`);
    return res.data;
  },
};
