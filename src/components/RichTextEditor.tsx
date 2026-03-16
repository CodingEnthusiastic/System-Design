import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../styles/editor.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'font': [] }],
    [{ 'align': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    ['blockquote', 'code-block'],
    ['link', 'image', 'video'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'font',
  'align',
  'list',
  'script',
  'blockquote', 'code-block',
  'link', 'image', 'video',
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
  readOnly = false,
}: RichTextEditorProps) {
  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme={readOnly ? 'view' : 'snow'}
        value={value}
        onChange={onChange}
        modules={readOnly ? {} : modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
        className="bg-secondary border-3 border-foreground"
      />
    </div>
  );
}

export default RichTextEditor;
