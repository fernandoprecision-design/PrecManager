import React, { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, secondaryAuth } from './firebase';
import { supabase, STORAGE_BUCKET } from './supabase';
import {
  FolderKanban,
  FileText,
  Download,
  Upload,
  Users,
  Plus,
  LogOut,
  CheckCircle2,
  Clock,
  Mail,
  Trash2,
  ShieldCheck,
  Search,
  HardDrive,
  AlertCircle,
} from 'lucide-react';

const DISCIPLINAS = [
  'Geral / Implantação',
  'Terraplenagem',
  'Drenagem Pluvial',
  'Abastecimento de Água',
  'Esgotamento Sanitário',
  'Pavimentação',
  'Estrutural',
  'Elétrica / Iluminação',
  'Memoriais e Orçamentos',
  'Aprovações / Certidões',
];

/* ============================================================================
   LOGOTIPO VETORIAL OFICIAL — GRUPO PRECISION
============================================================================ */
function GrupoPrecisionLogo({ size = 'md', showText = true }) {
  const dimensions = size === 'lg' ? 'w-16 h-16' : size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';

  return (
    <div className="inline-flex items-center gap-3 select-none">
      {/* Emblema Mira Grupo Precision */}
      <div className={`${dimensions} bg-white rounded-xl p-1.5 shadow-sm border border-slate-200/80 flex items-center justify-center shrink-0`}>
        <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Anel externo dividido em 4 quadrantes + laços */}
          {/* Quadrante Superior Direito + Laço Superior */}
          <path
            d="M 108 32 A 68 68 0 0 1 168 92 L 150 92 A 50 50 0 0 0 108 50 Z"
            fill="#7F091A"
          />
          <path
            d="M 108 34 C 108 14, 138 14, 138 34 C 138 46, 126 52, 115 48"
            stroke="#7F091A"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Quadrante Inferior Direito + Laço Direito */}
          <path
            d="M 168 108 A 68 68 0 0 1 108 168 L 108 150 A 50 50 0 0 0 150 108 Z"
            fill="#7F091A"
          />
          <path
            d="M 166 108 C 186 108, 186 138, 166 138 C 154 138, 148 126, 152 115"
            stroke="#7F091A"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Quadrante Inferior Esquerdo + Laço Inferior */}
          <path
            d="M 92 168 A 68 68 0 0 1 32 108 L 50 108 A 50 50 0 0 0 92 150 Z"
            fill="#7F091A"
          />
          <path
            d="M 92 166 C 92 186, 62 186, 62 166 C 62 154, 74 148, 85 152"
            stroke="#7F091A"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Quadrante Superior Esquerdo + Laço Esquerdo */}
          <path
            d="M 32 92 A 68 68 0 0 1 92 32 L 92 50 A 50 50 0 0 0 50 92 Z"
            fill="#7F091A"
          />
          <path
            d="M 34 92 C 14 92, 14 62, 34 62 C 46 62, 52 74, 48 85"
            stroke="#7F091A"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Setores internos cinza escuro */}
          <path d="M 93 64 A 36 36 0 0 0 64 93 L 93 93 Z" fill="#383838" />
          <path d="M 107 64 A 36 36 0 0 1 136 93 L 107 93 Z" fill="#383838" />
          <path d="M 136 107 A 36 36 0 0 1 107 136 L 107 107 Z" fill="#383838" />
          <path d="M 64 107 A 36 36 0 0 0 93 136 L 93 107 Z" fill="#383838" />

          {/* Cruz divisória branca */}
          <rect x="93" y="58" width="14" height="84" fill="#FFFFFF" />
          <rect x="58" y="93" width="84" height="14" fill="#FFFFFF" />

          {/* Ponto central bordô */}
          <circle cx="100" cy="100" r="10" fill="#7F091A" />
        </svg>
      </div>

      {showText && (
        <div className="leading-none">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-lg tracking-tight text-white">
              Prec<span className="text-blue-400">Manager</span>
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] font-bold tracking-[0.18em] uppercase text-slate-300">
            <span>GRUPO</span>
            <span className="text-rose-400">PRECISION</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUser(currentUser);
            setUserProfile({ id: currentUser.uid, ...docSnap.data() });
          } else {
            setLoginError('Perfil de usuário não encontrado no banco de dados.');
            await signOut(auth);
          }
        } catch (err) {
          console.error(err);
          setLoginError('Erro ao validar permissões de acesso.');
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setLoginError('E-mail ou senha inválidos. Verifique os dados e tente novamente.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-300 tracking-wide">Carregando PrecManager...</p>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          {/* Cabeçalho Institucional da Tela de Login */}
          <div className="bg-slate-900 px-8 py-8 text-center border-b border-slate-800 flex flex-col items-center">
            <GrupoPrecisionLogo size="lg" showText={false} />
            <div className="mt-3 tracking-[0.22em] text-xs font-extrabold uppercase">
              <span className="text-slate-300">GRUPO </span>
              <span className="text-rose-500">PRECISION</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-2">
              Prec<span className="text-blue-400">Manager</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Portal de Gestão e Entrega de Projetos de Engenharia
            </p>
          </div>

          <form onSubmit={handleLogin} className="p-8 space-y-5">
            {loginError && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                E-mail de Acesso
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@empresa.com.br"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Senha
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg text-sm transition shadow-sm"
            >
              {loggingIn ? 'Autenticando...' : 'Acessar Plataforma'}
            </button>

            <div className="pt-2 flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Grupo Precision • Entrega Técnica Rastreada</span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return userProfile.role === 'admin' ? (
    <AdminDashboard userProfile={userProfile} onLogout={handleLogout} />
  ) : (
    <ClientDashboard userProfile={userProfile} onLogout={handleLogout} />
  );
}

/* ============================================================================
   PAINEL ADMINISTRATIVO (GRUPO PRECISION)
============================================================================ */
function AdminDashboard({ userProfile, onLogout }) {
  const [activeTab, setActiveTab] = useState('arquivos');
  const [clientes, setClientes] = useState([]);
  const [empreendimentos, setEmpreendimentos] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [novoClienteEmpresa, setNovoClienteEmpresa] = useState('');
  const [novoClienteEmail, setNovoClienteEmail] = useState('');
  const [novoClienteSenha, setNovoClienteSenha] = useState('');
  const [salvandoCliente, setSalvandoCliente] = useState(false);

  const [empClienteId, setEmpClienteId] = useState('');
  const [empNome, setEmpNome] = useState('');
  const [empLocal, setEmpLocal] = useState('');
  const [empStatus, setEmpStatus] = useState('Em Andamento');
  const [salvandoEmp, setSalvandoEmp] = useState(false);

  const [upEmpId, setUpEmpId] = useState('');
  const [upTitulo, setUpTitulo] = useState('');
  const [upDisciplina, setUpDisciplina] = useState(DISCIPLINAS[0]);
  const [upRevisao, setUpRevisao] = useState('R00');
  const [upFile, setUpFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [filtroCliente, setFiltroCliente] = useState('');

  const carregarDados = async () => {
    setLoading(true);
    try {
      const qUsers = query(collection(db, 'users'), where('role', '==', 'client'));
      const snapUsers = await getDocs(qUsers);
      setClientes(snapUsers.docs.map((d) => ({ id: d.id, ...d.data() })));

      const snapEmps = await getDocs(collection(db, 'empreendimentos'));
      setEmpreendimentos(snapEmps.docs.map((d) => ({ id: d.id, ...d.data() })));

      const snapArqs = await getDocs(collection(db, 'arquivos'));
      const listaArqs = snapArqs.docs.map((d) => ({ id: d.id, ...d.data() }));
      listaArqs.sort((a, b) => (b.enviadoEm?.seconds || 0) - (a.enviadoEm?.seconds || 0));
      setArquivos(listaArqs);

      const snapLogs = await getDocs(collection(db, 'logs_download'));
      const listaLogs = snapLogs.docs.map((d) => ({ id: d.id, ...d.data() }));
      listaLogs.sort((a, b) => (b.baixadoEm?.seconds || 0) - (a.baixadoEm?.seconds || 0));
      setLogs(listaLogs);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleCriarCliente = async (e) => {
    e.preventDefault();
    if (novoClienteSenha.length < 6) {
      alert('A senha provisória deve ter no mínimo 6 caracteres.');
      return;
    }
    setSalvandoCliente(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        novoClienteEmail.trim(),
        novoClienteSenha
      );
      await setDoc(doc(db, 'users', cred.user.uid), {
        nome: novoClienteNome.trim(),
        empresa: novoClienteEmpresa.trim(),
        email: novoClienteEmail.trim(),
        role: 'client',
        criadoEm: serverTimestamp(),
      });
      await signOut(secondaryAuth);

      alert(
        `Cliente cadastrado com sucesso!\n\nLogin: ${novoClienteEmail}\nSenha: ${novoClienteSenha}\n\nCopie estes dados para enviar ao cliente.`
      );
      setNovoClienteNome('');
      setNovoClienteEmpresa('');
      setNovoClienteEmail('');
      setNovoClienteSenha('');
      carregarDados();
    } catch (err) {
      console.error(err);
      alert('Erro ao criar cliente: ' + (err.message || 'Verifique se o e-mail já está em uso.'));
    } finally {
      setSalvandoCliente(false);
    }
  };

  const handleCriarEmpreendimento = async (e) => {
    e.preventDefault();
    if (!empClienteId) {
      alert('Selecione um cliente.');
      return;
    }
    setSalvandoEmp(true);
    try {
      const clienteObj = clientes.find((c) => c.id === empClienteId);
      await addDoc(collection(db, 'empreendimentos'), {
        clienteId: empClienteId,
        clienteNome: clienteObj ? `${clienteObj.empresa} (${clienteObj.nome})` : '',
        nomeObra: empNome.trim(),
        localizacao: empLocal.trim(),
        status: empStatus,
        criadoEm: serverTimestamp(),
      });
      setEmpNome('');
      setEmpLocal('');
      carregarDados();
      alert('Empreendimento cadastrado com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao cadastrar empreendimento.');
    } finally {
      setSalvandoEmp(false);
    }
  };

  const handleUploadArquivo = async (e) => {
    e.preventDefault();
    if (!upEmpId || !upFile) {
      alert('Selecione o empreendimento e o arquivo.');
      return;
    }
    setUploading(true);
    try {
      const empObj = empreendimentos.find((item) => item.id === upEmpId);
      const extensao = upFile.name.split('.').pop();
      const nomeLimpo = upFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const caminhoStorage = `${empObj.clienteId}/${upEmpId}/${Date.now()}_${nomeLimpo}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(caminhoStorage, upFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(caminhoStorage);

      const tamanhoMB = (upFile.size / (1024 * 1024)).toFixed(2) + ' MB';

      await addDoc(collection(db, 'arquivos'), {
        empreendimentoId: upEmpId,
        empreendimentoNome: empObj.nomeObra,
        clienteId: empObj.clienteId,
        clienteNome: empObj.clienteNome,
        titulo: upTitulo.trim() || upFile.name,
        disciplina: upDisciplina,
        revisao: upRevisao.trim().toUpperCase(),
        nomeArquivo: upFile.name,
        extensao: extensao.toUpperCase(),
        tamanho: tamanhoMB,
        storagePath: caminhoStorage,
        storageUrl: publicData.publicUrl,
        enviadoEm: serverTimestamp(),
      });

      setUpTitulo('');
      setUpFile(null);
      document.getElementById('file-input').value = '';
      carregarDados();
      alert('Arquivo publicado com sucesso no portal do cliente!');
    } catch (err) {
      console.error(err);
      alert('Erro no upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleExcluirArquivo = async (arq) => {
    if (!window.confirm(`Deseja realmente excluir "${arq.titulo}"?`)) return;
    try {
      if (arq.storagePath) {
        await supabase.storage.from(STORAGE_BUCKET).remove([arq.storagePath]);
      }
      await deleteDoc(doc(db, 'arquivos', arq.id));
      carregarDados();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir arquivo.');
    }
  };

  const handleNotificarCliente = (arq) => {
    const cliente = clientes.find((c) => c.id === arq.clienteId);
    if (!cliente) return;

    const portalUrl = window.location.origin;
    const assunto = encodeURIComponent(
      `[Grupo Precision] Novo arquivo disponível - ${arq.empreendimentoNome} (${arq.revisao})`
    );
    const corpo = encodeURIComponent(
      `Olá, ${cliente.nome}!\n\nInformamos que um novo arquivo técnico foi disponibilizado no portal PrecManager:\n\n` +
        `• Empreendimento: ${arq.empreendimentoNome}\n` +
        `• Documento: ${arq.titulo}\n` +
        `• Disciplina: ${arq.disciplina}\n` +
        `• Revisão: ${arq.revisao}\n\n` +
        `Acesse a plataforma para realizar o download:\n${portalUrl}\n\n` +
        `Atenciosamente,\nEquipe Técnica - Grupo Precision`
    );

    window.open(`mailto:${cliente.email}?subject=${assunto}&body=${corpo}`, '_blank');
  };

  const arquivosFiltrados = filtroCliente
    ? arquivos.filter((a) => a.clienteId === filtroCliente)
    : arquivos;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GrupoPrecisionLogo size="md" showText={true} />
            <span className="hidden md:inline-block ml-2 text-xs px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
              Gestão Técnica
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-white">{userProfile.nome}</p>
              <p className="text-[11px] text-slate-400">
                {userProfile.empresa || 'Grupo Precision'} • Administrador
              </p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg border border-slate-700 transition"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6 overflow-x-auto">
          {[
            { id: 'arquivos', label: 'Entregas & Arquivos', icon: FileText, count: arquivos.length },
            { id: 'empreendimentos', label: 'Empreendimentos', icon: FolderKanban, count: empreendimentos.length },
            { id: 'clientes', label: 'Clientes & Acessos', icon: Users, count: clientes.length },
            { id: 'logs', label: 'Protocolo de Downloads', icon: CheckCircle2, count: logs.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 border-b-2 text-sm font-medium whitespace-nowrap transition ${
                  active
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Carregando dados da plataforma...</div>
        ) : (
          <>
            {activeTab === 'arquivos' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Upload className="w-5 h-5 text-blue-600" />
                    Publicar Novo Arquivo
                  </h2>

                  <form onSubmit={handleUploadArquivo} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Empreendimento / Obra *
                      </label>
                      <select
                        required
                        value={upEmpId}
                        onChange={(e) => setUpEmpId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                      >
                        <option value="">Selecione o empreendimento...</option>
                        {empreendimentos.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.nomeObra} — {emp.clienteNome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Título do Documento *
                      </label>
                      <input
                        type="text"
                        required
                        value={upTitulo}
                        onChange={(e) => setUpTitulo(e.target.value)}
                        placeholder="Ex: Projeto Executivo de Drenagem - Prancha 01/04"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Disciplina
                        </label>
                        <select
                          value={upDisciplina}
                          onChange={(e) => setUpDisciplina(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                        >
                          {DISCIPLINAS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Revisão
                        </label>
                        <input
                          type="text"
                          required
                          value={upRevisao}
                          onChange={(e) => setUpRevisao(e.target.value)}
                          placeholder="R00"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Arquivo (PDF, DWG, ZIP, XLSX) *
                      </label>
                      <input
                        id="file-input"
                        type="file"
                        required
                        onChange={(e) => setUpFile(e.target.files[0])}
                        className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-200 rounded-lg p-1.5"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={uploading}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Enviando arquivo...' : 'Disponibilizar para Cliente'}
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
                    <h2 className="text-base font-bold text-slate-800">
                      Arquivos Publicados ({arquivosFiltrados.length})
                    </h2>
                    <select
                      value={filtroCliente}
                      onChange={(e) => setFiltroCliente(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm bg-white"
                    >
                      <option value="">Todos os Clientes</option>
                      {clientes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.empresa} ({c.nome})
                        </option>
                      ))}
                    </select>
                  </div>

                  {arquivosFiltrados.length === 0 ? (
                    <div className="bg-white p-10 rounded-xl border border-slate-200 text-center text-slate-500 text-sm">
                      Nenhum arquivo publicado até o momento.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {arquivosFiltrados.map((arq) => (
                        <div
                          key={arq.id}
                          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                {arq.revisao}
                              </span>
                              <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                {arq.disciplina}
                              </span>
                              <span className="text-xs text-slate-400">
                                {arq.extensao} • {arq.tamanho}
                              </span>
                            </div>
                            <h3 className="font-semibold text-slate-900 text-sm">{arq.titulo}</h3>
                            <p className="text-xs text-slate-500">
                              <strong>{arq.empreendimentoNome}</strong> • {arq.clienteNome}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleNotificarCliente(arq)}
                              title="Enviar aviso por e-mail ao cliente"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              Notificar
                            </button>
                            <a
                              href={arq.storageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200"
                              title="Baixar arquivo"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => handleExcluirArquivo(arq)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 border border-red-200"
                              title="Excluir arquivo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'empreendimentos' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Plus className="w-5 h-5 text-blue-600" />
                    Novo Empreendimento
                  </h2>
                  <form onSubmit={handleCriarEmpreendimento} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Cliente Proprietário *
                      </label>
                      <select
                        required
                        value={empClienteId}
                        onChange={(e) => setEmpClienteId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                      >
                        <option value="">Selecione o cliente...</option>
                        {clientes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.empresa} ({c.nome})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Nome do Empreendimento / Obra *
                      </label>
                      <input
                        type="text"
                        required
                        value={empNome}
                        onChange={(e) => setEmpNome(e.target.value)}
                        placeholder="Ex: Loteamento Jardim das Acácias"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Cidade / Localização
                      </label>
                      <input
                        type="text"
                        value={empLocal}
                        onChange={(e) => setEmpLocal(e.target.value)}
                        placeholder="Ex: Lorena - SP"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Status
                      </label>
                      <select
                        value={empStatus}
                        onChange={(e) => setEmpStatus(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                      >
                        <option value="Em Andamento">Em Andamento</option>
                        <option value="Concluído / Entregue">Concluído / Entregue</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={salvandoEmp}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition"
                    >
                      {salvandoEmp ? 'Salvando...' : 'Cadastrar Empreendimento'}
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 h-fit">
                  {empreendimentos.map((emp) => (
                    <div
                      key={emp.id}
                      className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          {emp.status}
                        </span>
                        <span className="text-xs text-slate-400">{emp.localizacao}</span>
                      </div>
                      <h3 className="font-bold text-slate-900">{emp.nomeObra}</h3>
                      <p className="text-xs text-slate-500">{emp.clienteNome}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'clientes' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Plus className="w-5 h-5 text-blue-600" />
                    Criar Acesso de Cliente
                  </h2>
                  <form onSubmit={handleCriarCliente} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Empresa / Incorporadora *
                      </label>
                      <input
                        type="text"
                        required
                        value={novoClienteEmpresa}
                        onChange={(e) => setNovoClienteEmpresa(e.target.value)}
                        placeholder="Ex: Construtora Horizonte Ltda"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Nome do Responsável *
                      </label>
                      <input
                        type="text"
                        required
                        value={novoClienteNome}
                        onChange={(e) => setNovoClienteNome(e.target.value)}
                        placeholder="Ex: Eng. Carlos Mendes"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        E-mail de Login *
                      </label>
                      <input
                        type="email"
                        required
                        value={novoClienteEmail}
                        onChange={(e) => setNovoClienteEmail(e.target.value)}
                        placeholder="carlos@horizonte.com.br"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Senha Provisória (mín. 6 caracteres) *
                      </label>
                      <input
                        type="text"
                        required
                        value={novoClienteSenha}
                        onChange={(e) => setNovoClienteSenha(e.target.value)}
                        placeholder="Ex: Precision@2026"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={salvandoCliente}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition"
                    >
                      {salvandoCliente ? 'Gerando credenciais...' : 'Cadastrar Cliente'}
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                        <th className="py-3.5 px-4">Empresa</th>
                        <th className="py-3.5 px-4">Contato</th>
                        <th className="py-3.5 px-4">E-mail de Acesso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {clientes.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-semibold text-slate-900">{c.empresa}</td>
                          <td className="py-3.5 px-4 text-slate-600">{c.nome}</td>
                          <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{c.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-800">
                    Registro Oficial de Recebimento de Arquivos • Grupo Precision
                  </h2>
                  <span className="text-xs text-slate-500">Total: {logs.length} downloads</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-white">
                        <th className="py-3 px-4">Data / Hora</th>
                        <th className="py-3 px-4">Cliente</th>
                        <th className="py-3 px-4">Empreendimento</th>
                        <th className="py-3 px-4">Arquivo Baixado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {logs.map((log) => {
                        const dataFormatada = log.baixadoEm?.seconds
                          ? new Date(log.baixadoEm.seconds * 1000).toLocaleString('pt-BR')
                          : 'Registrado';
                        return (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 text-xs font-mono text-slate-600">
                              {dataFormatada}
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-900">
                              {log.clienteNome}
                            </td>
                            <td className="py-3 px-4 text-slate-600">{log.empreendimentoNome}</td>
                            <td className="py-3 px-4 text-blue-700 font-medium">
                              {log.arquivoNome}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        PrecManager • Sistema de Entrega Técnica de Projetos — <strong>Grupo Precision</strong>
      </footer>
    </div>
  );
}

/* ============================================================================
   PAINEL DO CLIENTE (ÁREA DE DOWNLOADS)
============================================================================ */
function ClientDashboard({ userProfile, onLogout }) {
  const [empreendimentos, setEmpreendimentos] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState('TODOS');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarPortalCliente = async () => {
      setLoading(true);
      try {
        const qEmps = query(
          collection(db, 'empreendimentos'),
          where('clienteId', '==', userProfile.id)
        );
        const snapEmps = await getDocs(qEmps);
        setEmpreendimentos(snapEmps.docs.map((d) => ({ id: d.id, ...d.data() })));

        const qArqs = query(
          collection(db, 'arquivos'),
          where('clienteId', '==', userProfile.id)
        );
        const snapArqs = await getDocs(qArqs);
        const lista = snapArqs.docs.map((d) => ({ id: d.id, ...d.data() }));
        lista.sort((a, b) => (b.enviadoEm?.seconds || 0) - (a.enviadoEm?.seconds || 0));
        setArquivos(lista);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    carregarPortalCliente();
  }, [userProfile.id]);

  const handleDownloadComProtocolo = async (arq) => {
    try {
      await addDoc(collection(db, 'logs_download'), {
        arquivoId: arq.id,
        arquivoNome: `${arq.titulo} (${arq.revisao})`,
        empreendimentoNome: arq.empreendimentoNome,
        clienteId: userProfile.id,
        clienteNome: `${userProfile.empresa} - ${userProfile.nome}`,
        baixadoEm: serverTimestamp(),
      });
    } catch (err) {
      console.error('Erro ao registrar protocolo:', err);
    }

    window.open(arq.storageUrl, '_blank');
  };

  const arquivosVisiveis = arquivos.filter((arq) => {
    const matchEmp = selectedEmp === 'TODOS' || arq.empreendimentoId === selectedEmp;
    const matchBusca =
      arq.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      arq.disciplina.toLowerCase().includes(busca.toLowerCase());
    return matchEmp && matchBusca;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <GrupoPrecisionLogo size="md" showText={true} />

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-white">{userProfile.empresa}</p>
              <p className="text-[11px] text-slate-400">{userProfile.nome}</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg border border-slate-700 transition"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <span>Acervo Técnico • Grupo Precision</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Central de Projetos e Entregas Técnicas
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Selecione um empreendimento abaixo para visualizar e baixar os arquivos finalizados.
          </p>

          <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedEmp('TODOS')}
              className={`px-4 py-2.5 rounded-xl border text-left shrink-0 transition ${
                selectedEmp === 'TODOS'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <p className="text-xs font-bold">Todos os Empreendimentos</p>
              <p className="text-[11px] opacity-80">{arquivos.length} arquivo(s)</p>
            </button>

            {empreendimentos.map((emp) => {
              const qtd = arquivos.filter((a) => a.empreendimentoId === emp.id).length;
              const active = selectedEmp === emp.id;
              return (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmp(emp.id)}
                  className={`px-4 py-2.5 rounded-xl border text-left shrink-0 transition ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <p className="text-xs font-bold">{emp.nomeObra}</p>
                  <p className="text-[11px] opacity-80">
                    {emp.localizacao || 'Projeto Técnico'} • {qtd} arquivo(s)
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-5">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Filtrar por título ou disciplina (ex: Drenagem)..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Carregando seus projetos...</div>
        ) : arquivosVisiveis.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-2">
            <HardDrive className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Nenhum arquivo disponível</p>
            <p className="text-xs text-slate-500">
              Assim que a equipe técnica da Grupo Precision publicar os arquivos, eles aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {arquivosVisiveis.map((arq) => {
              const dataEnvio = arq.enviadoEm?.seconds
                ? new Date(arq.enviadoEm.seconds * 1000).toLocaleDateString('pt-BR')
                : 'Recente';

              return (
                <div
                  key={arq.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-blue-600 text-white">
                        {arq.revisao}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {arq.disciplina}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Publicado em {dataEnvio}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{arq.titulo}</h3>

                    <p className="text-xs text-slate-500">
                      Empreendimento: <strong>{arq.empreendimentoNome}</strong> • Arquivo:{' '}
                      <span className="font-mono">{arq.nomeArquivo}</span> ({arq.tamanho})
                    </p>
                  </div>

                  <button
                    onClick={() => handleDownloadComProtocolo(arq)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition shadow-sm shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    Baixar Arquivo
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        PrecManager • Portal de Projetos — <strong>Grupo Precision</strong>
      </footer>
    </div>
  );
}
