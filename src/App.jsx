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
  updateDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, secondaryAuth } from './firebase';
import { supabase, STORAGE_BUCKET } from './supabase';
import {
  Building2,
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
  Tags,
  Pencil,
  Check,
  X,
  Lock,
  Unlock,
} from 'lucide-react';

const DISCIPLINAS_PADRAO = [
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
      <div className={`${dimensions} bg-white rounded-xl p-1.5 shadow-sm border border-slate-200/80 flex items-center justify-center shrink-0`}>
        <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          <path d="M 93 64 A 36 36 0 0 0 64 93 L 93 93 Z" fill="#383838" />
          <path d="M 107 64 A 36 36 0 0 1 136 93 L 107 93 Z" fill="#383838" />
          <path d="M 136 107 A 36 36 0 0 1 107 136 L 107 107 Z" fill="#383838" />
          <path d="M 64 107 A 36 36 0 0 0 93 136 L 93 107 Z" fill="#383838" />
          <rect x="93" y="58" width="14" height="84" fill="#FFFFFF" />
          <rect x="58" y="93" width="84" height="14" fill="#FFFFFF" />
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
                placeholder="usuario@empresa.com.br"
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
  const [empresas, setEmpresas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [empreendimentos, setEmpreendimentos] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Nova Empresa
  const [novaEmpNome, setNovaEmpNome] = useState('');
  const [novaEmpCnpj, setNovaEmpCnpj] = useState('');
  const [novaEmpCidade, setNovaEmpCidade] = useState('');
  const [salvandoEmpresa, setSalvandoEmpresa] = useState(false);

  // Novo Usuário + Permissões
  const [userEmpresaId, setUserEmpresaId] = useState('');
  const [userNome, setUserNome] = useState('');
  const [userCargo, setUserCargo] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userSenha, setUserSenha] = useState('');
  const [userAcessoTotal, setUserAcessoTotal] = useState(true);
  const [userEmpsPermitidos, setUserEmpsPermitidos] = useState([]);
  const [salvandoUser, setSalvandoUser] = useState(false);

  // Modal/Drawer Edição de Permissões de Usuário Existente
  const [editUserModal, setEditUserModal] = useState(null);
  const [editAcessoTotal, setEditAcessoTotal] = useState(true);
  const [editEmpsPermitidos, setEditEmpsPermitidos] = useState([]);
  const [salvandoPermissoes, setSalvandoPermissoes] = useState(false);

  // Novo Empreendimento
  const [empEmpresaId, setEmpEmpresaId] = useState('');
  const [empNome, setEmpNome] = useState('');
  const [empLocal, setEmpLocal] = useState('');
  const [empStatus, setEmpStatus] = useState('Em Andamento');
  const [salvandoEmp, setSalvandoEmp] = useState(false);

  // Upload Arquivo
  const [upEmpId, setUpEmpId] = useState('');
  const [upTitulo, setUpTitulo] = useState('');
  const [upDisciplina, setUpDisciplina] = useState('');
  const [upRevisao, setUpRevisao] = useState('R00');
  const [upFile, setUpFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Gestão de Disciplinas (CRUD)
  const [novaDisciplinaNome, setNovaDisciplinaNome] = useState('');
  const [salvandoDisc, setSalvandoDisc] = useState(false);
  const [editandoDiscId, setEditandoDiscId] = useState(null);
  const [editandoDiscNome, setEditandoDiscNome] = useState('');

  // Filtros
  const [filtroEmpresa, setFiltroEmpresa] = useState('');

  const carregarDados = async () => {
    setLoading(true);
    try {
      // 1. Empresas
      const snapEmpresas = await getDocs(collection(db, 'empresas'));
      const listaEmpresas = snapEmpresas.docs.map((d) => ({ id: d.id, ...d.data() }));
      listaEmpresas.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      setEmpresas(listaEmpresas);

      // 2. Usuários Clientes
      const qUsers = query(collection(db, 'users'), where('role', '==', 'client'));
      const snapUsers = await getDocs(qUsers);
      const listaUsers = snapUsers.docs.map((d) => ({ id: d.id, ...d.data() }));
      listaUsers.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      setUsuarios(listaUsers);

      // 3. Empreendimentos
      const snapEmps = await getDocs(collection(db, 'empreendimentos'));
      const listaEmps = snapEmps.docs.map((d) => ({ id: d.id, ...d.data() }));
      listaEmps.sort((a, b) => a.nomeObra.localeCompare(b.nomeObra, 'pt-BR'));
      setEmpreendimentos(listaEmps);

      // 4. Disciplinas
      const snapDiscs = await getDocs(collection(db, 'disciplinas'));
      let listaDiscs = snapDiscs.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (listaDiscs.length === 0) {
        for (const nomePadrao of DISCIPLINAS_PADRAO) {
          const docRef = await addDoc(collection(db, 'disciplinas'), {
            nome: nomePadrao,
            criadoEm: serverTimestamp(),
          });
          listaDiscs.push({ id: docRef.id, nome: nomePadrao });
        }
      }
      listaDiscs.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      setDisciplinas(listaDiscs);
      if (listaDiscs.length > 0 && !upDisciplina) {
        setUpDisciplina(listaDiscs[0].nome);
      }

      // 5. Arquivos
      const snapArqs = await getDocs(collection(db, 'arquivos'));
      const listaArqs = snapArqs.docs.map((d) => ({ id: d.id, ...d.data() }));
      listaArqs.sort((a, b) => (b.enviadoEm?.seconds || 0) - (a.enviadoEm?.seconds || 0));
      setArquivos(listaArqs);

      // 6. Logs de Download
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

  /* --- Handlers de Empresas --- */
  const handleCriarEmpresa = async (e) => {
    e.preventDefault();
    if (!novaEmpNome.trim()) return;
    setSalvandoEmpresa(true);
    try {
      await addDoc(collection(db, 'empresas'), {
        nome: novaEmpNome.trim(),
        cnpj: novaEmpCnpj.trim(),
        cidade: novaEmpCidade.trim(),
        criadoEm: serverTimestamp(),
      });
      setNovaEmpNome('');
      setNovaEmpCnpj('');
      setNovaEmpCidade('');
      carregarDados();
      alert('Empresa cadastrada com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao cadastrar empresa.');
    } finally {
      setSalvandoEmpresa(false);
    }
  };

  /* --- Handlers de Usuários & Permissões --- */
  const toggleEmpPermitidoNovo = (empId) => {
    setUserEmpsPermitidos((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleCriarUsuario = async (e) => {
    e.preventDefault();
    if (!userEmpresaId) {
      alert('Selecione a empresa à qual este usuário pertence.');
      return;
    }
    if (userSenha.length < 6) {
      alert('A senha provisória deve ter no mínimo 6 caracteres.');
      return;
    }
    if (!userAcessoTotal && userEmpsPermitidos.length === 0) {
      alert('Selecione pelo menos um empreendimento permitido ou marque "Acesso Total".');
      return;
    }

    setSalvandoUser(true);
    try {
      const empresaObj = empresas.find((emp) => emp.id === userEmpresaId);
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        userEmail.trim(),
        userSenha
      );

      await setDoc(doc(db, 'users', cred.user.uid), {
        nome: userNome.trim(),
        cargo: userCargo.trim(),
        empresaId: userEmpresaId,
        empresa: empresaObj ? empresaObj.nome : '',
        email: userEmail.trim(),
        role: 'client',
        acessoTotal: userAcessoTotal,
        empreendimentosPermitidos: userAcessoTotal ? [] : userEmpsPermitidos,
        criadoEm: serverTimestamp(),
      });
      await signOut(secondaryAuth);

      alert(
        `Usuário cadastrado com sucesso!\n\nEmpresa: ${empresaObj?.nome}\nLogin: ${userEmail}\nSenha: ${userSenha}`
      );
      setUserNome('');
      setUserCargo('');
      setUserEmail('');
      setUserSenha('');
      setUserAcessoTotal(true);
      setUserEmpsPermitidos([]);
      carregarDados();
    } catch (err) {
      console.error(err);
      alert('Erro ao criar usuário: ' + (err.message || 'Verifique se o e-mail já está em uso.'));
    } finally {
      setSalvandoUser(false);
    }
  };

  const abrirEditorPermissoes = (u) => {
    setEditUserModal(u);
    setEditAcessoTotal(u.acessoTotal !== false);
    setEditEmpsPermitidos(u.empreendimentosPermitidos || []);
  };

  const toggleEmpPermitidoEdicao = (empId) => {
    setEditEmpsPermitidos((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleSalvarPermissoes = async () => {
    if (!editUserModal) return;
    if (!editAcessoTotal && editEmpsPermitidos.length === 0) {
      alert('Selecione ao menos um empreendimento ou ative o Acesso Total.');
      return;
    }
    setSalvandoPermissoes(true);
    try {
      await updateDoc(doc(db, 'users', editUserModal.id), {
        acessoTotal: editAcessoTotal,
        empreendimentosPermitidos: editAcessoTotal ? [] : editEmpsPermitidos,
      });
      setEditUserModal(null);
      carregarDados();
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar permissões.');
    } finally {
      setSalvandoPermissoes(false);
    }
  };

  /* --- Handlers de Empreendimentos --- */
  const handleCriarEmpreendimento = async (e) => {
    e.preventDefault();
    if (!empEmpresaId) {
      alert('Selecione a empresa proprietária.');
      return;
    }
    setSalvandoEmp(true);
    try {
      const empresaObj = empresas.find((emp) => emp.id === empEmpresaId);
      await addDoc(collection(db, 'empreendimentos'), {
        empresaId: empEmpresaId,
        empresaNome: empresaObj ? empresaObj.nome : '',
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

  /* --- Handlers de Disciplinas --- */
  const handleCriarDisciplina = async (e) => {
    e.preventDefault();
    const nomeLimpo = novaDisciplinaNome.trim();
    if (!nomeLimpo) return;
    if (disciplinas.some((d) => d.nome.toLowerCase() === nomeLimpo.toLowerCase())) {
      alert('Já existe uma disciplina cadastrada com esse nome.');
      return;
    }
    setSalvandoDisc(true);
    try {
      await addDoc(collection(db, 'disciplinas'), {
        nome: nomeLimpo,
        criadoEm: serverTimestamp(),
      });
      setNovaDisciplinaNome('');
      await carregarDados();
      setUpDisciplina(nomeLimpo);
    } catch (err) {
      console.error(err);
      alert('Erro ao cadastrar disciplina.');
    } finally {
      setSalvandoDisc(false);
    }
  };

  const handleSalvarEdicaoDisciplina = async (disc) => {
    const novoNome = editandoDiscNome.trim();
    if (!novoNome) return;
    try {
      await updateDoc(doc(db, 'disciplinas', disc.id), { nome: novoNome });
      const arquivosVinculados = arquivos.filter((a) => a.disciplina === disc.nome);
      for (const arq of arquivosVinculados) {
        await updateDoc(doc(db, 'arquivos', arq.id), { disciplina: novoNome });
      }
      setEditandoDiscId(null);
      setEditandoDiscNome('');
      await carregarDados();
    } catch (err) {
      console.error(err);
      alert('Erro ao editar disciplina.');
    }
  };

  const handleExcluirDisciplina = async (disc) => {
    if (!window.confirm(`Deseja realmente excluir a disciplina "${disc.nome}"?`)) return;
    try {
      await deleteDoc(doc(db, 'disciplinas', disc.id));
      await carregarDados();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir disciplina.');
    }
  };

  /* --- Handlers de Arquivos --- */
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
      const caminhoStorage = `${empObj.empresaId}/${upEmpId}/${Date.now()}_${nomeLimpo}`;

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
        empresaId: empObj.empresaId,
        empresaNome: empObj.empresaNome,
        titulo: upTitulo.trim() || upFile.name,
        disciplina: upDisciplina || 'Geral',
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

  const handleNotificarUsuariosDaObra = (arq) => {
    // Filtra apenas os usuários daquela empresa que têm acesso a este empreendimento
    const destinatarios = usuarios.filter(
      (u) =>
        u.empresaId === arq.empresaId &&
        (u.acessoTotal === true || (u.empreendimentosPermitidos || []).includes(arq.empreendimentoId))
    );

    if (destinatarios.length === 0) {
      alert('Nenhum usuário cadastrado possui permissão ativa para este empreendimento.');
      return;
    }

    const emails = destinatarios.map((u) => u.email).join(',');
    const portalUrl = window.location.origin;
    const assunto = encodeURIComponent(
      `[Grupo Precision] Novo arquivo disponível - ${arq.empreendimentoNome} (${arq.revisao})`
    );
    const corpo = encodeURIComponent(
      `Prezados,\n\nInformamos que um novo arquivo técnico foi disponibilizado no portal PrecManager:\n\n` +
        `• Empresa: ${arq.empresaNome}\n` +
        `• Empreendimento: ${arq.empreendimentoNome}\n` +
        `• Documento: ${arq.titulo}\n` +
        `• Disciplina: ${arq.disciplina}\n` +
        `• Revisão: ${arq.revisao}\n\n` +
        `Acesse a plataforma com seu login individual para realizar o download:\n${portalUrl}\n\n` +
        `Atenciosamente,\nEquipe Técnica - Grupo Precision`
    );

    window.open(`mailto:${emails}?subject=${assunto}&body=${corpo}`, '_blank');
  };

  const arquivosFiltrados = filtroEmpresa
    ? arquivos.filter((a) => a.empresaId === filtroEmpresa)
    : arquivos;

  const empreendimentosDaEmpresaSelecionada = empreendimentos.filter(
    (emp) => emp.empresaId === userEmpresaId
  );

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

      {/* Navegação por Abas */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6 overflow-x-auto">
          {[
            { id: 'arquivos', label: 'Entregas & Arquivos', icon: FileText, count: arquivos.length },
            { id: 'empresas', label: 'Empresas', icon: Building2, count: empresas.length },
            { id: 'empreendimentos', label: 'Empreendimentos', icon: FolderKanban, count: empreendimentos.length },
            { id: 'usuarios', label: 'Usuários & Permissões', icon: Users, count: usuarios.length },
            { id: 'disciplinas', label: 'Disciplinas', icon: Tags, count: disciplinas.length },
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
            {/* ABA 1: ENTREGAS & ARQUIVOS */}
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
                            {emp.nomeObra} — {emp.empresaNome}
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
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-600">
                            Disciplina
                          </label>
                          <button
                            type="button"
                            onClick={() => setActiveTab('disciplinas')}
                            className="text-[11px] font-semibold text-blue-600 hover:underline"
                          >
                            + Gerenciar
                          </button>
                        </div>
                        <select
                          value={upDisciplina}
                          onChange={(e) => setUpDisciplina(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                        >
                          {disciplinas.map((d) => (
                            <option key={d.id} value={d.nome}>
                              {d.nome}
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
                      {uploading ? 'Enviando arquivo...' : 'Disponibilizar para Equipe'}
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
                    <h2 className="text-base font-bold text-slate-800">
                      Arquivos Publicados ({arquivosFiltrados.length})
                    </h2>
                    <select
                      value={filtroEmpresa}
                      onChange={(e) => setFiltroEmpresa(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm bg-white"
                    >
                      <option value="">Todas as Empresas</option>
                      {empresas.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.nome}
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
                              <strong>{arq.empreendimentoNome}</strong> • {arq.empresaNome}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleNotificarUsuariosDaObra(arq)}
                              title="Notificar por e-mail os usuários autorizados nesta obra"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              Notificar Equipe
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

            {/* ABA 2: EMPRESAS */}
            {activeTab === 'empresas' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Plus className="w-5 h-5 text-blue-600" />
                    Cadastrar Empresa Cliente
                  </h2>
                  <form onSubmit={handleCriarEmpresa} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Razão Social / Nome Fantasia *
                      </label>
                      <input
                        type="text"
                        required
                        value={novaEmpNome}
                        onChange={(e) => setNovaEmpNome(e.target.value)}
                        placeholder="Ex: Construtora Horizonte Ltda"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        CNPJ (Opcional)
                      </label>
                      <input
                        type="text"
                        value={novaEmpCnpj}
                        onChange={(e) => setNovaEmpCnpj(e.target.value)}
                        placeholder="00.000.000/0001-00"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Cidade / UF
                      </label>
                      <input
                        type="text"
                        value={novaEmpCidade}
                        onChange={(e) => setNovaEmpCidade(e.target.value)}
                        placeholder="Ex: São José dos Campos - SP"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={salvandoEmpresa}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition"
                    >
                      {salvandoEmpresa ? 'Salvando...' : 'Salvar Empresa'}
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 h-fit">
                  {empresas.map((emp) => {
                    const qtdObras = empreendimentos.filter((o) => o.empresaId === emp.id).length;
                    const qtdUsers = usuarios.filter((u) => u.empresaId === emp.id).length;

                    return (
                      <div
                        key={emp.id}
                        className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-slate-900 text-base">{emp.nome}</h3>
                          <span className="text-xs text-slate-400 shrink-0">{emp.cidade}</span>
                        </div>
                        {emp.cnpj && (
                          <p className="text-xs font-mono text-slate-500">CNPJ: {emp.cnpj}</p>
                        )}
                        <div className="pt-2 flex items-center gap-3 text-xs font-medium text-slate-600 border-t border-slate-100">
                          <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700">
                            {qtdObras} empreendimento(s)
                          </span>
                          <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                            {qtdUsers} usuário(s)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ABA 3: EMPREENDIMENTOS */}
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
                        Empresa Proprietária *
                      </label>
                      <select
                        required
                        value={empEmpresaId}
                        onChange={(e) => setEmpEmpresaId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                      >
                        <option value="">Selecione a empresa...</option>
                        {empresas.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.nome}
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
                      <p className="text-xs font-medium text-slate-500">{emp.empresaNome}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ABA 4: USUÁRIOS & MATRIZ DE PERMISSÕES */}
            {activeTab === 'usuarios' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulário Criar Usuário com Permissões */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Plus className="w-5 h-5 text-blue-600" />
                    Novo Usuário & Permissões
                  </h2>
                  <form onSubmit={handleCriarUsuario} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Empresa Vinculada *
                      </label>
                      <select
                        required
                        value={userEmpresaId}
                        onChange={(e) => {
                          setUserEmpresaId(e.target.value);
                          setUserEmpsPermitidos([]);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                      >
                        <option value="">Selecione a empresa...</option>
                        {empresas.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={userNome}
                          onChange={(e) => setUserNome(e.target.value)}
                          placeholder="Eng. Carlos Silva"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Cargo / Função
                        </label>
                        <input
                          type="text"
                          value={userCargo}
                          onChange={(e) => setUserCargo(e.target.value)}
                          placeholder="Ex: Coord. Obras"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        E-mail de Login *
                      </label>
                      <input
                        type="email"
                        required
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="carlos@empresa.com.br"
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
                        value={userSenha}
                        onChange={(e) => setUserSenha(e.target.value)}
                        placeholder="Ex: Precision@2026"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>

                    {/* Seletor de Nível de Permissão */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Permissão de Acesso aos Projetos
                      </label>

                      <div className="space-y-2">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="radio"
                            name="nivelAcesso"
                            checked={userAcessoTotal === true}
                            onChange={() => setUserAcessoTotal(true)}
                            className="mt-1 text-blue-600"
                          />
                          <div className="text-xs">
                            <span className="font-semibold text-slate-900 block">
                              Acesso Total (Todos os Projetos)
                            </span>
                            <span className="text-slate-500">
                              Visualiza todos os empreendimentos atuais e futuros desta empresa.
                            </span>
                          </div>
                        </label>

                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="radio"
                            name="nivelAcesso"
                            checked={userAcessoTotal === false}
                            onChange={() => setUserAcessoTotal(false)}
                            className="mt-1 text-blue-600"
                          />
                          <div className="text-xs">
                            <span className="font-semibold text-slate-900 block">
                              Acesso Restrito (Projetos Específicos)
                            </span>
                            <span className="text-slate-500">
                              Acessa apenas os empreendimentos marcados abaixo.
                            </span>
                          </div>
                        </label>
                      </div>

                      {!userAcessoTotal && (
                        <div className="pt-2 border-t border-slate-200 space-y-1.5 max-h-40 overflow-y-auto">
                          {!userEmpresaId ? (
                            <p className="text-xs text-amber-600">
                              Selecione uma empresa acima para listar os projetos.
                            </p>
                          ) : empreendimentosDaEmpresaSelecionada.length === 0 ? (
                            <p className="text-xs text-slate-500">
                              Nenhum empreendimento cadastrado para esta empresa ainda.
                            </p>
                          ) : (
                            empreendimentosDaEmpresaSelecionada.map((emp) => (
                              <label
                                key={emp.id}
                                className="flex items-center gap-2 text-xs text-slate-700 p-1.5 rounded hover:bg-white cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={userEmpsPermitidos.includes(emp.id)}
                                  onChange={() => toggleEmpPermitidoNovo(emp.id)}
                                  className="rounded text-blue-600"
                                />
                                <span>{emp.nomeObra}</span>
                              </label>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={salvandoUser}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition"
                    >
                      {salvandoUser ? 'Gerando acesso...' : 'Cadastrar Usuário'}
                    </button>
                  </form>
                </div>

                {/* Lista de Usuários e Gestão de Permissões */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-800">
                      Usuários Cadastrados por Empresa ({usuarios.length})
                    </h2>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                          <th className="py-3.5 px-4">Usuário / Cargo</th>
                          <th className="py-3.5 px-4">Empresa</th>
                          <th className="py-3.5 px-4">Permissão de Projetos</th>
                          <th className="py-3.5 px-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-sm">
                        {usuarios.map((u) => {
                          const total = u.acessoTotal !== false;
                          const nomesPermitidos = (u.empreendimentosPermitidos || [])
                            .map((id) => empreendimentos.find((e) => e.id === id)?.nomeObra)
                            .filter(Boolean);

                          return (
                            <tr key={u.id} className="hover:bg-slate-50">
                              <td className="py-3.5 px-4">
                                <p className="font-semibold text-slate-900">{u.nome}</p>
                                <p className="text-xs text-slate-500 font-mono">{u.email}</p>
                                {u.cargo && (
                                  <span className="inline-block mt-0.5 text-[11px] text-slate-400">
                                    {u.cargo}
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 font-medium text-slate-700">
                                {u.empresa}
                              </td>
                              <td className="py-3.5 px-4">
                                {total ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <Unlock className="w-3 h-3" />
                                    Acesso Total
                                  </span>
                                ) : (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                      <Lock className="w-3 h-3" />
                                      Restrito ({nomesPermitidos.length})
                                    </span>
                                    <p className="text-[11px] text-slate-500 max-w-xs truncate">
                                      {nomesPermitidos.join(', ') || 'Nenhuma obra vinculada'}
                                    </p>
                                  </div>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => abrirEditorPermissoes(u)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  Permissões
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ABA 5: DISCIPLINAS */}
            {activeTab === 'disciplinas' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Plus className="w-5 h-5 text-blue-600" />
                    Nova Disciplina
                  </h2>
                  <form onSubmit={handleCriarDisciplina} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Nome da Disciplina / Categoria *
                      </label>
                      <input
                        type="text"
                        required
                        value={novaDisciplinaNome}
                        onChange={(e) => setNovaDisciplinaNome(e.target.value)}
                        placeholder="Ex: Topografia / Sondagem"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={salvandoDisc}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {salvandoDisc ? 'Adicionando...' : 'Adicionar Disciplina'}
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-800">
                      Disciplinas Cadastradas ({disciplinas.length})
                    </h2>
                  </div>

                  <div className="divide-y divide-slate-200">
                    {disciplinas.map((disc) => {
                      const emEdicao = editandoDiscId === disc.id;
                      const qtdArquivos = arquivos.filter((a) => a.disciplina === disc.nome).length;

                      return (
                        <div
                          key={disc.id}
                          className="px-4 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 transition"
                        >
                          {emEdicao ? (
                            <div className="flex-1 flex items-center gap-2">
                              <input
                                type="text"
                                autoFocus
                                value={editandoDiscNome}
                                onChange={(e) => setEditandoDiscNome(e.target.value)}
                                className="flex-1 px-3 py-1.5 rounded-lg border border-blue-400 text-sm"
                              />
                              <button
                                onClick={() => handleSalvarEdicaoDisciplina(disc)}
                                className="p-2 rounded-lg bg-emerald-600 text-white"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditandoDiscId(null)}
                                className="p-2 rounded-lg bg-slate-200 text-slate-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-3">
                                <span className="font-medium text-sm text-slate-800">
                                  {disc.nome}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                  {qtdArquivos} arquivo(s)
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditandoDiscId(disc.id);
                                    setEditandoDiscNome(disc.nome);
                                  }}
                                  className="p-2 rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleExcluirDisciplina(disc)}
                                  className="p-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ABA 6: PROTOCOLO DE DOWNLOADS */}
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
                        <th className="py-3 px-4">Empresa / Usuário</th>
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

      {/* MODAL DE EDIÇÃO DE PERMISSÕES DE USUÁRIO */}
      {editUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Gerenciar Permissões</h3>
                <p className="text-xs text-slate-400">
                  {editUserModal.nome} • {editUserModal.empresa}
                </p>
              </div>
              <button
                onClick={() => setEditUserModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  checked={editAcessoTotal === true}
                  onChange={() => setEditAcessoTotal(true)}
                  className="mt-1 text-blue-600"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">
                    Acesso Total (Todos os Empreendimentos)
                  </span>
                  <span className="text-slate-500">
                    Libera todos os projetos atuais e futuros de {editUserModal.empresa}.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  checked={editAcessoTotal === false}
                  onChange={() => setEditAcessoTotal(false)}
                  className="mt-1 text-blue-600"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">
                    Acesso Restrito (Selecionar Obras)
                  </span>
                  <span className="text-slate-500">
                    Escolha abaixo quais empreendimentos este usuário pode visualizar:
                  </span>
                </div>
              </label>

              {!editAcessoTotal && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 max-h-48 overflow-y-auto">
                  {empreendimentos
                    .filter((emp) => emp.empresaId === editUserModal.empresaId)
                    .map((emp) => (
                      <label
                        key={emp.id}
                        className="flex items-center gap-2.5 text-xs font-medium text-slate-800 p-1.5 rounded hover:bg-white cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={editEmpsPermitidos.includes(emp.id)}
                          onChange={() => toggleEmpPermitidoEdicao(emp.id)}
                          className="rounded text-blue-600"
                        />
                        <span>{emp.nomeObra}</span>
                      </label>
                    ))}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setEditUserModal(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarPermissoes}
                  disabled={salvandoPermissoes}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {salvandoPermissoes ? 'Salvando...' : 'Salvar Permissões'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        PrecManager • Sistema de Entrega Técnica de Projetos — <strong>Grupo Precision</strong>
      </footer>
    </div>
  );
}

/* ============================================================================
   PAINEL DO CLIENTE (ÁREA DE DOWNLOADS COM FILTRO DE PERMISSÃO)
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
        if (!userProfile.empresaId) {
          setLoading(false);
          return;
        }

        const qEmps = query(
          collection(db, 'empreendimentos'),
          where('empresaId', '==', userProfile.empresaId)
        );
        const snapEmps = await getDocs(qEmps);
        let listaEmps = snapEmps.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Aplica filtro de permissão do usuário
        if (userProfile.acessoTotal !== true) {
          const permitidos = userProfile.empreendimentosPermitidos || [];
          listaEmps = listaEmps.filter((emp) => permitidos.includes(emp.id));
        }
        setEmpreendimentos(listaEmps);

        const idsPermitidos = listaEmps.map((e) => e.id);

        if (idsPermitidos.length > 0) {
          const qArqs = query(
            collection(db, 'arquivos'),
            where('empresaId', '==', userProfile.empresaId)
          );
          const snapArqs = await getDocs(qArqs);
          let listaArqs = snapArqs.docs.map((d) => ({ id: d.id, ...d.data() }));
          listaArqs = listaArqs.filter((arq) => idsPermitidos.includes(arq.empreendimentoId));
          listaArqs.sort((a, b) => (b.enviadoEm?.seconds || 0) - (a.enviadoEm?.seconds || 0));
          setArquivos(listaArqs);
        } else {
          setArquivos([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    carregarPortalCliente();
  }, [userProfile]);

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
              <p className="text-[11px] text-slate-400">
                {userProfile.nome} {userProfile.cargo ? `• ${userProfile.cargo}` : ''}
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <span>Acervo Técnico • Grupo Precision</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Central de Projetos e Entregas Técnicas
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Selecione um empreendimento liberado para visualizar e baixar os arquivos finalizados.
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
              Não há arquivos publicados nos empreendimentos vinculados ao seu perfil de acesso.
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
