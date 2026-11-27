import React, { useState, useEffect, useCallback } from 'react';
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
  Timestamp,
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
  Archive,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Layers,
  Menu,
  Eye,
  Phone,
  MapPin,
  UserCheck,
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
      <div
        className={`${dimensions} bg-white rounded-xl p-1.5 shadow-sm border border-slate-200/80 flex items-center justify-center shrink-0`}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 108 32 A 68 68 0 0 1 168 92 L 150 92 A 50 50 0 0 0 108 50 Z" fill="#7F091A" />
          <path d="M 108 34 C 108 14, 138 14, 138 34 C 138 46, 126 52, 115 48" stroke="#7F091A" strokeWidth="12" strokeLinecap="round" />
          <path d="M 168 108 A 68 68 0 0 1 108 168 L 108 150 A 50 50 0 0 0 150 108 Z" fill="#7F091A" />
          <path d="M 166 108 C 186 108, 186 138, 166 138 C 154 138, 148 126, 152 115" stroke="#7F091A" strokeWidth="12" strokeLinecap="round" />
          <path d="M 92 168 A 68 68 0 0 1 32 108 L 50 108 A 50 50 0 0 0 92 150 Z" fill="#7F091A" />
          <path d="M 92 166 C 92 186, 62 186, 62 166 C 62 154, 74 148, 85 152" stroke="#7F091A" strokeWidth="12" strokeLinecap="round" />
          <path d="M 32 92 A 68 68 0 0 1 92 32 L 92 50 A 50 50 0 0 0 50 92 Z" fill="#7F091A" />
          <path d="M 34 92 C 14 92, 14 62, 34 62 C 46 62, 52 74, 48 85" stroke="#7F091A" strokeWidth="12" strokeLinecap="round" />
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

/* Helpers de Expiração */
function isUsuarioExpirado(userData) {
  if (!userData || !userData.expiraEm) return false;
  const expMillis = userData.expiraEm.seconds
    ? userData.expiraEm.seconds * 1000
    : new Date(userData.expiraEm).getTime();
  return Date.now() > expMillis;
}

function formatarDataExpiracao(expiraEm) {
  if (!expiraEm) return 'Acesso Permanente';
  const dateObj = expiraEm.seconds ? new Date(expiraEm.seconds * 1000) : new Date(expiraEm);
  return dateObj.toLocaleDateString('pt-BR');
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
            const dados = docSnap.data();
            if (dados.role !== 'admin' && isUsuarioExpirado(dados)) {
              setLoginError(
                'O prazo de validade do seu acesso expirou e os arquivos foram arquivados. Entre em contato com a Grupo Precision caso precise reativar.'
              );
              await signOut(auth);
              setUser(null);
              setUserProfile(null);
              setLoadingAuth(false);
              return;
            }
            setUser(currentUser);
            setUserProfile({ id: currentUser.uid, ...dados });
          } else {
            setLoginError('Perfil de usuário não encontrado ou encerrado no sistema.');
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [empresas, setEmpresas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [empreendimentos, setEmpreendimentos] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [logs, setLogs] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cadastro Completo de Empresa (Novo / Edição)
  const [formEmpresaOpen, setFormEmpresaOpen] = useState(false);
  const [editEmpresaId, setEditEmpresaId] = useState(null);
  const [empCadastroNome, setEmpCadastroNome] = useState('');
  const [empCadastroCnpj, setEmpCadastroCnpj] = useState('');
  const [empCadastroIe, setEmpCadastroIe] = useState('');
  const [empCadastroResponsavel, setEmpCadastroResponsavel] = useState('');
  const [empCadastroEmail, setEmpCadastroEmail] = useState('');
  const [empCadastroTelefone, setEmpCadastroTelefone] = useState('');
  const [empCadastroEndereco, setEmpCadastroEndereco] = useState('');
  const [empCadastroCidade, setEmpCadastroCidade] = useState('');
  const [empCadastroObs, setEmpCadastroObs] = useState('');
  const [salvandoEmpresa, setSalvandoEmpresa] = useState(false);
  const [buscaEmpresas, setBuscaEmpresas] = useState('');
  const [fichaEmpresaModal, setFichaEmpresaModal] = useState(null);

  // Novo Usuário + Permissões + Prazo
  const [userEmpresaId, setUserEmpresaId] = useState('');
  const [userNome, setUserNome] = useState('');
  const [userCargo, setUserCargo] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userSenha, setUserSenha] = useState('');
  const [userAcessoTotal, setUserAcessoTotal] = useState(true);
  const [userEmpsPermitidos, setUserEmpsPermitidos] = useState([]);
  const [userPrazoDias, setUserPrazoDias] = useState('PERMANENTE');
  const [userDataCustom, setUserDataCustom] = useState('');
  const [salvandoUser, setSalvandoUser] = useState(false);

  // Modal Edição de Permissões & Prazo
  const [editUserModal, setEditUserModal] = useState(null);
  const [editAcessoTotal, setEditAcessoTotal] = useState(true);
  const [editEmpsPermitidos, setEditEmpsPermitidos] = useState([]);
  const [editPrazoModo, setEditPrazoModo] = useState('MANTER');
  const [editDataCustom, setEditDataCustom] = useState('');
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

  // Gestão de Disciplinas
  const [novaDisciplinaNome, setNovaDisciplinaNome] = useState('');
  const [salvandoDisc, setSalvandoDisc] = useState(false);
  const [editandoDiscId, setEditandoDiscId] = useState(null);
  const [editandoDiscNome, setEditandoDiscNome] = useState('');

  // Filtros
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [buscaHistorico, setBuscaHistorico] = useState('');

  /* --- Limpeza Automática Silenciosa em Segundo Plano --- */
  const executarLimpezaAutomaticaSilenciosa = async (listaUsers, listaArqs, listaHist) => {
    const expirados = listaUsers.filter((u) => isUsuarioExpirado(u));
    if (expirados.length === 0) return false;

    try {
      const idsExpirados = expirados.map((u) => u.id);

      for (const uExp of expirados) {
        const outrosAtivosNaEmpresa = listaUsers.filter(
          (u) => u.empresaId === uExp.empresaId && !idsExpirados.includes(u.id)
        );

        if (outrosAtivosNaEmpresa.length === 0) {
          const arqsDaEmpresa = listaArqs.filter((a) => a.empresaId === uExp.empresaId);
          for (const arq of arqsDaEmpresa) {
            if (arq.storagePath) {
              await supabase.storage.from(STORAGE_BUCKET).remove([arq.storagePath]);
            }
            await deleteDoc(doc(db, 'arquivos', arq.id));

            const histMatch = listaHist.find((h) => h.arquivoIdOriginal === arq.id);
            if (histMatch) {
              await updateDoc(doc(db, 'historico_entregas', histMatch.id), {
                statusArquivo: 'Expirado (Limpeza Automática)',
                expurgadoEm: serverTimestamp(),
              });
            }
          }
        }

        await deleteDoc(doc(db, 'users', uExp.id));
      }
      return true;
    } catch (err) {
      console.error('Erro na limpeza automática:', err);
      return false;
    }
  };

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const snapEmpresas = await getDocs(collection(db, 'empresas'));
      const listaEmpresas = snapEmpresas.docs.map((d) => ({ id: d.id, ...d.data() }));
      listaEmpresas.sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));

      const qUsers = query(collection(db, 'users'), where('role', '==', 'client'));
      const snapUsers = await getDocs(qUsers);
      const listaUsers = snapUsers.docs.map((d) => ({ id: d.id, ...d.data() }));
      listaUsers.sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));

      const snapEmps = await getDocs(collection(db, 'empreendimentos'));
      const listaEmps = snapEmps.docs.map((d) => ({ id: d.id, ...d.data() }));
      listaEmps.sort((a, b) => (a.nomeObra || '').localeCompare(b.nomeObra || '', 'pt-BR'));

      const snapArqs = await getDocs(collection(db, 'arquivos'));
      const listaArqs = snapArqs.docs.map((d) => ({ id: d.id, ...d.data() }));
      listaArqs.sort((a, b) => (b.enviadoEm?.seconds || 0) - (a.enviadoEm?.seconds || 0));

      const snapHist = await getDocs(collection(db, 'historico_entregas'));
      const listaHist = snapHist.docs.map((d) => ({ id: d.id, ...d.data() }));
      listaHist.sort((a, b) => (b.dataPublicacao?.seconds || 0) - (a.dataPublicacao?.seconds || 0));

      const houveLimpeza = await executarLimpezaAutomaticaSilenciosa(
        listaUsers,
        listaArqs,
        listaHist
      );
      if (houveLimpeza) {
        return carregarDados();
      }

      setEmpresas(listaEmpresas);
      setUsuarios(listaUsers);
      setEmpreendimentos(listaEmps);
      setArquivos(listaArqs);
      setHistorico(listaHist);

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

      const snapLogs = await getDocs(collection(db, 'logs_download'));
      const listaLogs = snapLogs.docs.map((d) => ({ id: d.id, ...d.data() }));
      listaLogs.sort((a, b) => (b.baixadoEm?.seconds || 0) - (a.baixadoEm?.seconds || 0));
      setLogs(listaLogs);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, [upDisciplina]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const calcularTimestampExpiracao = (modo, dataCustom) => {
    if (modo === 'PERMANENTE') return null;
    if (modo === 'CUSTOM') {
      if (!dataCustom) return null;
      const d = new Date(`${dataCustom}T23:59:59`);
      return Timestamp.fromDate(d);
    }
    const dias = parseInt(modo, 10);
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return Timestamp.fromDate(d);
  };

  /* --- Handlers Cadastro Completo de Empresas --- */
  const abrirNovoCadastroEmpresa = () => {
    setEditEmpresaId(null);
    setEmpCadastroNome('');
    setEmpCadastroCnpj('');
    setEmpCadastroIe('');
    setEmpCadastroResponsavel('');
    setEmpCadastroEmail('');
    setEmpCadastroTelefone('');
    setEmpCadastroEndereco('');
    setEmpCadastroCidade('');
    setEmpCadastroObs('');
    setFormEmpresaOpen(true);
  };

  const abrirEdicaoEmpresa = (emp) => {
    setEditEmpresaId(emp.id);
    setEmpCadastroNome(emp.nome || '');
    setEmpCadastroCnpj(emp.cnpj || '');
    setEmpCadastroIe(emp.inscricaoEstadual || '');
    setEmpCadastroResponsavel(emp.responsavel || '');
    setEmpCadastroEmail(emp.email || '');
    setEmpCadastroTelefone(emp.telefone || '');
    setEmpCadastroEndereco(emp.endereco || '');
    setEmpCadastroCidade(emp.cidade || '');
    setEmpCadastroObs(emp.observacoes || '');
    setFormEmpresaOpen(true);
  };

  const handleSalvarEmpresa = async (e) => {
    e.preventDefault();
    if (!empCadastroNome.trim()) {
      alert('Informe pelo menos o Nome / Razão Social da empresa.');
      return;
    }
    setSalvandoEmpresa(true);
    try {
      const dadosEmpresa = {
        nome: empCadastroNome.trim(),
        cnpj: empCadastroCnpj.trim(),
        inscricaoEstadual: empCadastroIe.trim(),
        responsavel: empCadastroResponsavel.trim(),
        email: empCadastroEmail.trim(),
        telefone: empCadastroTelefone.trim(),
        endereco: empCadastroEndereco.trim(),
        cidade: empCadastroCidade.trim(),
        observacoes: empCadastroObs.trim(),
      };

      if (editEmpresaId) {
        await updateDoc(doc(db, 'empresas', editEmpresaId), {
          ...dadosEmpresa,
          atualizadoEm: serverTimestamp(),
        });
        alert('Dados da empresa atualizados com sucesso!');
      } else {
        await addDoc(collection(db, 'empresas'), {
          ...dadosEmpresa,
          criadoEm: serverTimestamp(),
        });
        alert('Empresa cadastrada com sucesso!');
      }

      setFormEmpresaOpen(false);
      setEditEmpresaId(null);
      await carregarDados();
    } catch (err) {
      console.error('Erro Firestore empresas:', err);
      alert(
        'Não foi possível salvar a empresa no banco de dados.\n\n' +
          'Verifique se você já publicou as novas Regras de Segurança no Console do Firebase (Firestore Database → Regras).\n\n' +
          'Detalhe técnico: ' +
          (err.message || err.code)
      );
    } finally {
      setSalvandoEmpresa(false);
    }
  };

  const handleExcluirEmpresa = async (emp) => {
    const obrasVinculadas = empreendimentos.filter((o) => o.empresaId === emp.id).length;
    const usersVinculados = usuarios.filter((u) => u.empresaId === emp.id).length;

    if (obrasVinculadas > 0 || usersVinculados > 0) {
      alert(
        `Não é possível excluir "${emp.nome}" enquanto houver ${obrasVinculadas} empreendimento(s) e ${usersVinculados} usuário(s) vinculados a ela.`
      );
      return;
    }

    if (!window.confirm(`Deseja realmente excluir o cadastro de "${emp.nome}"?`)) return;

    try {
      await deleteDoc(doc(db, 'empresas', emp.id));
      await carregarDados();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir empresa: ' + err.message);
    }
  };

  /* --- Handlers Usuários --- */
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
    if (userPrazoDias === 'CUSTOM' && !userDataCustom) {
      alert('Informe a data limite de expiração.');
      return;
    }

    setSalvandoUser(true);
    try {
      const empresaObj = empresas.find((emp) => emp.id === userEmpresaId);
      const expiraEmTimestamp = calcularTimestampExpiracao(userPrazoDias, userDataCustom);

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
        expiraEm: expiraEmTimestamp,
        criadoEm: serverTimestamp(),
      });
      await signOut(secondaryAuth);

      const textoValidade = expiraEmTimestamp
        ? `Válido até ${formatarDataExpiracao(expiraEmTimestamp)}`
        : 'Acesso Permanente';

      alert(
        `Usuário cadastrado com sucesso!\n\nEmpresa: ${empresaObj?.nome}\nLogin: ${userEmail}\nSenha: ${userSenha}\nValidade: ${textoValidade}`
      );
      setUserNome('');
      setUserCargo('');
      setUserEmail('');
      setUserSenha('');
      setUserAcessoTotal(true);
      setUserEmpsPermitidos([]);
      setUserPrazoDias('PERMANENTE');
      setUserDataCustom('');
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
    setEditPrazoModo('MANTER');
    setEditDataCustom('');
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
      const payload = {
        acessoTotal: editAcessoTotal,
        empreendimentosPermitidos: editAcessoTotal ? [] : editEmpsPermitidos,
      };
      if (editPrazoModo !== 'MANTER') {
        payload.expiraEm = calcularTimestampExpiracao(editPrazoModo, editDataCustom);
      }
      await updateDoc(doc(db, 'users', editUserModal.id), payload);
      setEditUserModal(null);
      carregarDados();
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar permissões.');
    } finally {
      setSalvandoPermissoes(false);
    }
  };

  /* --- Handlers Empreendimentos --- */
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
      alert('Erro ao cadastrar empreendimento: ' + err.message);
    } finally {
      setSalvandoEmp(false);
    }
  };

  /* --- Handlers Disciplinas --- */
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

  /* --- Handlers Arquivos --- */
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

      const docArqRef = await addDoc(collection(db, 'arquivos'), {
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

      const usuariosComAcesso = usuarios
        .filter(
          (u) =>
            u.empresaId === empObj.empresaId &&
            (u.acessoTotal === true || (u.empreendimentosPermitidos || []).includes(upEmpId))
        )
        .map((u) => `${u.nome} (${u.email})`);

      await addDoc(collection(db, 'historico_entregas'), {
        arquivoIdOriginal: docArqRef.id,
        empresaNome: empObj.empresaNome,
        empreendimentoNome: empObj.nomeObra,
        titulo: upTitulo.trim() || upFile.name,
        disciplina: upDisciplina || 'Geral',
        revisao: upRevisao.trim().toUpperCase(),
        nomeArquivoOriginal: upFile.name,
        tamanho: tamanhoMB,
        usuariosLiberados: usuariosComAcesso.join('; ') || 'Nenhum usuário vinculado no envio',
        statusArquivo: 'Ativo no Portal',
        dataPublicacao: serverTimestamp(),
      });

      setUpTitulo('');
      setUpFile(null);
      document.getElementById('file-input').value = '';
      carregarDados();
      alert('Arquivo publicado com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro no upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleExcluirArquivo = async (arq) => {
    if (
      !window.confirm(
        `Deseja remover "${arq.titulo}" do portal ativo? (O registro no Histórico Permanente será mantido)`
      )
    )
      return;
    try {
      if (arq.storagePath) {
        await supabase.storage.from(STORAGE_BUCKET).remove([arq.storagePath]);
      }
      await deleteDoc(doc(db, 'arquivos', arq.id));

      const histCorrespondente = historico.find((h) => h.arquivoIdOriginal === arq.id);
      if (histCorrespondente) {
        await updateDoc(doc(db, 'historico_entregas', histCorrespondente.id), {
          statusArquivo: 'Removido Manualmente',
          expurgadoEm: serverTimestamp(),
        });
      }

      carregarDados();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir arquivo.');
    }
  };

  const handleNotificarUsuariosDaObra = (arq) => {
    const destinatarios = usuarios.filter(
      (u) =>
        u.empresaId === arq.empresaId &&
        !isUsuarioExpirado(u) &&
        (u.acessoTotal === true ||
          (u.empreendimentosPermitidos || []).includes(arq.empreendimentoId))
    );

    if (destinatarios.length === 0) {
      alert('Nenhum usuário ativo possui permissão para este empreendimento.');
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

  const navGroups = [
    {
      title: 'Operacional',
      items: [
        { id: 'arquivos', label: 'Entregas & Arquivos', icon: FileText, count: arquivos.length },
        { id: 'empresas', label: 'Empresas Clientes', icon: Building2, count: empresas.length },
        { id: 'empreendimentos', label: 'Empreendimentos', icon: FolderKanban, count: empreendimentos.length },
      ],
    },
    {
      title: 'Governança & Acervo',
      items: [
        { id: 'usuarios', label: 'Usuários & Prazos', icon: Users, count: usuarios.length },
        { id: 'disciplinas', label: 'Disciplinas', icon: Tags, count: disciplinas.length },
        { id: 'historico', label: 'Histórico Permanente', icon: Archive, count: historico.length },
        { id: 'logs', label: 'Protocolo Downloads', icon: CheckCircle2, count: logs.length },
      ],
    },
  ];

  const currentTabInfo =
    navGroups.flatMap((g) => g.items).find((item) => item.id === activeTab) || navGroups[0].items[0];

  const empresasFiltradas = empresas.filter(
    (emp) =>
      (emp.nome || '').toLowerCase().includes(buscaEmpresas.toLowerCase()) ||
      (emp.cnpj || '').toLowerCase().includes(buscaEmpresas.toLowerCase()) ||
      (emp.responsavel || '').toLowerCase().includes(buscaEmpresas.toLowerCase()) ||
      (emp.cidade || '').toLowerCase().includes(buscaEmpresas.toLowerCase()) ||
      (emp.telefone || '').toLowerCase().includes(buscaEmpresas.toLowerCase())
  );

  const arquivosFiltrados = filtroEmpresa
    ? arquivos.filter((a) => a.empresaId === filtroEmpresa)
    : arquivos;

  const historicoFiltrado = historico.filter(
    (h) =>
      h.empresaNome?.toLowerCase().includes(buscaHistorico.toLowerCase()) ||
      h.empreendimentoNome?.toLowerCase().includes(buscaHistorico.toLowerCase()) ||
      h.titulo?.toLowerCase().includes(buscaHistorico.toLowerCase()) ||
      h.usuariosLiberados?.toLowerCase().includes(buscaHistorico.toLowerCase())
  );

  const empreendimentosDaEmpresaSelecionada = empreendimentos.filter(
    (emp) => emp.empresaId === userEmpresaId
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 z-30 lg:hidden"
        />
      )}

      {/* SIDEBAR ESQUERDA */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-72 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <GrupoPrecisionLogo size="md" showText={true} />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                {group.title}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      active
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                        active ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/40 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{userProfile.nome}</p>
              <p className="text-[11px] text-slate-400 truncate">Gestão • Grupo Precision</p>
            </div>
            <button
              onClick={onLogout}
              title="Sair do sistema"
              className="p-2 rounded-lg bg-slate-800 hover:bg-red-600/20 hover:text-red-400 text-slate-300 border border-slate-700 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400 hidden sm:inline">Administração</span>
              <ChevronRight className="w-4 h-4 text-slate-300 hidden sm:inline" />
              <span className="font-bold text-slate-900">{currentTabInfo.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Limpeza Automática Ativa</span>
          </div>
        </header>

        <main className="p-4 sm:p-8 max-w-7xl w-full mx-auto flex-1">
          {loading ? (
            <div className="text-center py-12 text-slate-500">Carregando dados da plataforma...</div>
          ) : (
            <>
              {/* ABA 1: ENTREGAS & ARQUIVOS */}
              {activeTab === 'arquivos' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
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

                  <div className="xl:col-span-2 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
                      <h2 className="text-base font-bold text-slate-800">
                        Arquivos Ativos no Portal ({arquivosFiltrados.length})
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
                        Nenhum arquivo ativo no momento.
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
                                title="Remover do portal ativo"
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

              {/* ABA 2: CADASTRO GERAL & CONSULTA DE EMPRESAS CLIENTES */}
              {activeTab === 'empresas' && (
                <div className="space-y-6">
                  {/* Barra Superior de Ação e Busca */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Cadastro Geral de Empresas Clientes ({empresas.length})
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Consulte dados cadastrais, responsáveis, contatos, obras e usuários vinculados.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="relative sm:w-72">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={buscaEmpresas}
                          onChange={(e) => setBuscaEmpresas(e.target.value)}
                          placeholder="Buscar empresa, CNPJ, contato..."
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <button
                        onClick={abrirNovoCadastroEmpresa}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition shadow-sm shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        Nova Empresa
                      </button>
                    </div>
                  </div>

                  {/* Tabela Geral de Consulta */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    {empresasFiltradas.length === 0 ? (
                      <div className="p-12 text-center space-y-2">
                        <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-sm font-semibold text-slate-700">
                          Nenhuma empresa cadastrada ou encontrada
                        </p>
                        <p className="text-xs text-slate-500">
                          Clique em "+ Nova Empresa" acima para iniciar o cadastro.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                              <th className="py-3.5 px-4">Empresa / CNPJ</th>
                              <th className="py-3.5 px-4">Responsável & Contato</th>
                              <th className="py-3.5 px-4">Cidade / UF</th>
                              <th className="py-3.5 px-4">Vínculos</th>
                              <th className="py-3.5 px-4 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-sm">
                            {empresasFiltradas.map((emp) => {
                              const qtdObras = empreendimentos.filter(
                                (o) => o.empresaId === emp.id
                              ).length;
                              const qtdUsers = usuarios.filter(
                                (u) => u.empresaId === emp.id
                              ).length;

                              return (
                                <tr key={emp.id} className="hover:bg-slate-50 transition">
                                  <td className="py-3.5 px-4">
                                    <p className="font-bold text-slate-900">{emp.nome}</p>
                                    <p className="text-xs font-mono text-slate-500">
                                      {emp.cnpj || 'CNPJ não informado'}
                                    </p>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <p className="text-xs font-semibold text-slate-800">
                                      {emp.responsavel || '—'}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {emp.telefone || emp.email || 'Sem contato registrado'}
                                    </p>
                                  </td>
                                  <td className="py-3.5 px-4 text-xs text-slate-600">
                                    {emp.cidade || '—'}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                                        {qtdObras} obra(s)
                                      </span>
                                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                                        {qtdUsers} user(s)
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4 text-right">
                                    <div className="inline-flex items-center gap-1.5">
                                      <button
                                        onClick={() => setFichaEmpresaModal(emp)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                                        title="Consultar ficha completa"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        Ficha
                                      </button>
                                      <button
                                        onClick={() => abrirEdicaoEmpresa(emp)}
                                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition"
                                        title="Editar cadastro"
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleExcluirEmpresa(emp)}
                                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
                                        title="Excluir empresa"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ABA 3: EMPREENDIMENTOS */}
              {activeTab === 'empreendimentos' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
                      <Plus className="w-5 h-5 text-blue-600" />
                      Novo Empreendimento
                    </h2>
                    <form onSubmit={handleCriarEmpreendimento} className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-600">
                            Empresa Proprietária *
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('empresas');
                              abrirNovoCadastroEmpresa();
                            }}
                            className="text-[11px] font-semibold text-blue-600 hover:underline"
                          >
                            + Nova Empresa
                          </button>
                        </div>
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

                  <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 h-fit">
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

              {/* ABA 4: USUÁRIOS, PERMISSÕES & PRAZO LIMITE */}
              {activeTab === 'usuarios' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
                      <Plus className="w-5 h-5 text-blue-600" />
                      Novo Usuário & Prazo
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
                            placeholder="Ex: Cliente Avulso"
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

                      <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-2.5">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                          <CalendarClock className="w-4 h-4 text-blue-600" />
                          Prazo Limite de Acesso
                        </label>
                        <select
                          value={userPrazoDias}
                          onChange={(e) => setUserPrazoDias(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                        >
                          <option value="PERMANENTE">Sem expiração (Cliente Recorrente)</option>
                          <option value="30">30 dias (Cliente Esporádico)</option>
                          <option value="60">60 dias (Cliente Esporádico)</option>
                          <option value="90">90 dias — 3 meses (Padrão Esporádico)</option>
                          <option value="180">180 dias — 6 meses</option>
                          <option value="CUSTOM">Definir data específica...</option>
                        </select>

                        {userPrazoDias === 'CUSTOM' && (
                          <input
                            type="date"
                            required
                            value={userDataCustom}
                            onChange={(e) => setUserDataCustom(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                          />
                        )}
                      </div>

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
                            <span className="text-xs font-semibold text-slate-900">
                              Acesso Total (Todos os Projetos)
                            </span>
                          </label>

                          <label className="flex items-start gap-2.5 cursor-pointer">
                            <input
                              type="radio"
                              name="nivelAcesso"
                              checked={userAcessoTotal === false}
                              onChange={() => setUserAcessoTotal(false)}
                              className="mt-1 text-blue-600"
                            />
                            <span className="text-xs font-semibold text-slate-900">
                              Acesso Restrito (Projetos Específicos)
                            </span>
                          </label>
                        </div>

                        {!userAcessoTotal && (
                          <div className="pt-2 border-t border-slate-200 space-y-1.5 max-h-36 overflow-y-auto">
                            {!userEmpresaId ? (
                              <p className="text-xs text-amber-600">Selecione uma empresa acima.</p>
                            ) : empreendimentosDaEmpresaSelecionada.length === 0 ? (
                              <p className="text-xs text-slate-500">
                                Nenhum empreendimento nesta empresa.
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

                  <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                      <h2 className="text-sm font-bold text-slate-800">
                        Usuários Ativos ({usuarios.length})
                      </h2>
                      <span className="text-xs text-slate-500">
                        Contas vencidas são limpas automaticamente
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-white border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                            <th className="py-3.5 px-4">Usuário / Empresa</th>
                            <th className="py-3.5 px-4">Validade do Acesso</th>
                            <th className="py-3.5 px-4">Projetos</th>
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
                                  <p className="text-xs font-medium text-blue-700 mt-0.5">
                                    {u.empresa}
                                  </p>
                                </td>
                                <td className="py-3.5 px-4">
                                  {u.expiraEm ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                      <Clock className="w-3 h-3" />
                                      Até {formatarDataExpiracao(u.expiraEm)}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                                      Permanente
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4">
                                  {total ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                      <Unlock className="w-3.5 h-3.5" />
                                      Todos
                                    </span>
                                  ) : (
                                    <span className="text-xs text-slate-700">
                                      <Lock className="w-3 h-3 inline mr-1 text-amber-600" />
                                      {nomesPermitidos.length} obra(s)
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <button
                                    onClick={() => abrirEditorPermissoes(u)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Editar
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
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
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

                  <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
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

              {/* ABA 6: HISTÓRICO PERMANENTE */}
              {activeTab === 'historico' && (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Archive className="w-5 h-5 text-blue-600" />
                      Acervo Histórico Permanente de Entregas
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Registro definitivo de todas as entregas realizadas. Quando o prazo de um cliente expira, os arquivos pesados são removidos automaticamente do Storage, mas este histórico permanece salvo.
                    </p>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="text-xs font-bold text-slate-700 uppercase">
                        Registros ({historicoFiltrado.length})
                      </span>
                      <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={buscaHistorico}
                          onChange={(e) => setBuscaHistorico(e.target.value)}
                          placeholder="Buscar empresa, obra, arquivo..."
                          className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-white">
                            <th className="py-3 px-4">Data Entrega</th>
                            <th className="py-3 px-4">Empresa / Empreendimento</th>
                            <th className="py-3 px-4">Arquivo / Revisão</th>
                            <th className="py-3 px-4">Usuários Liberados</th>
                            <th className="py-3 px-4">Status Storage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs">
                          {historicoFiltrado.map((h) => {
                            const dataPub = h.dataPublicacao?.seconds
                              ? new Date(h.dataPublicacao.seconds * 1000).toLocaleDateString('pt-BR')
                              : 'Registrado';
                            const ativo = h.statusArquivo === 'Ativo no Portal';

                            return (
                              <tr key={h.id} className="hover:bg-slate-50">
                                <td className="py-3 px-4 font-mono text-slate-600">{dataPub}</td>
                                <td className="py-3 px-4">
                                  <p className="font-bold text-slate-900">{h.empresaNome}</p>
                                  <p className="text-slate-500">{h.empreendimentoNome}</p>
                                </td>
                                <td className="py-3 px-4">
                                  <p className="font-semibold text-slate-800">
                                    [{h.revisao}] {h.titulo}
                                  </p>
                                  <p className="font-mono text-[11px] text-slate-400">
                                    {h.nomeArquivoOriginal} ({h.tamanho})
                                  </p>
                                </td>
                                <td className="py-3 px-4 text-slate-600 max-w-xs">
                                  {h.usuariosLiberados}
                                </td>
                                <td className="py-3 px-4">
                                  <span
                                    className={`px-2 py-0.5 rounded-full font-semibold ${
                                      ativo
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {h.statusArquivo}
                                  </span>
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

              {/* ABA 7: PROTOCOLO DE DOWNLOADS */}
              {activeTab === 'logs' && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
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
      </div>

      {/* MODAL: FORMULÁRIO COMPLETO DE CADASTRO / EDIÇÃO DE EMPRESA */}
      {formEmpresaOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {editEmpresaId ? 'Editar Cadastro da Empresa' : 'Cadastro Completo de Empresa Cliente'}
                </h3>
                <p className="text-xs text-slate-400">
                  Apenas o Nome / Razão Social é obrigatório; preencha o restante conforme necessário.
                </p>
              </div>
              <button
                onClick={() => setFormEmpresaOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarEmpresa} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Razão Social / Nome Fantasia *
                  </label>
                  <input
                    type="text"
                    required
                    value={empCadastroNome}
                    onChange={(e) => setEmpCadastroNome(e.target.value)}
                    placeholder="Ex: Construtora Horizonte Ltda"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    CNPJ / CPF
                  </label>
                  <input
                    type="text"
                    value={empCadastroCnpj}
                    onChange={(e) => setEmpCadastroCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Inscrição Estadual / Municipal
                  </label>
                  <input
                    type="text"
                    value={empCadastroIe}
                    onChange={(e) => setEmpCadastroIe(e.target.value)}
                    placeholder="Opcional"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Responsável Principal
                  </label>
                  <input
                    type="text"
                    value={empCadastroResponsavel}
                    onChange={(e) => setEmpCadastroResponsavel(e.target.value)}
                    placeholder="Ex: Eng. Roberto Almeida"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={empCadastroTelefone}
                    onChange={(e) => setEmpCadastroTelefone(e.target.value)}
                    placeholder="(12) 99999-9999"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    E-mail Corporativo / Financeiro
                  </label>
                  <input
                    type="email"
                    value={empCadastroEmail}
                    onChange={(e) => setEmpCadastroEmail(e.target.value)}
                    placeholder="contato@empresa.com.br"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    value={empCadastroEndereco}
                    onChange={(e) => setEmpCadastroEndereco(e.target.value)}
                    placeholder="Rua / Av., Número, Bairro, CEP"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Cidade / UF
                  </label>
                  <input
                    type="text"
                    value={empCadastroCidade}
                    onChange={(e) => setEmpCadastroCidade(e.target.value)}
                    placeholder="Ex: Guaratinguetá - SP"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Observações Internas
                  </label>
                  <textarea
                    rows={2}
                    value={empCadastroObs}
                    onChange={(e) => setEmpCadastroObs(e.target.value)}
                    placeholder="Anotações de contrato, escopo ou preferências de entrega..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFormEmpresaOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoEmpresa}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {salvandoEmpresa
                    ? 'Salvando...'
                    : editEmpresaId
                    ? 'Salvar Alterações'
                    : 'Cadastrar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FICHA COMPLETA DE CONSULTA DA EMPRESA */}
      {fichaEmpresaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">{fichaEmpresaModal.nome}</h3>
                <p className="text-xs text-slate-400">
                  Ficha Cadastral Completa • Grupo Precision
                </p>
              </div>
              <button
                onClick={() => setFichaEmpresaModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-sm">
              {/* Dados Cadastrais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block">CNPJ / CPF</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {fichaEmpresaModal.cnpj || 'Não informado'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Inscrição Estadual / Municipal</span>
                  <span className="font-semibold text-slate-800">
                    {fichaEmpresaModal.inscricaoEstadual || 'Não informado'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> Responsável
                  </span>
                  <span className="font-semibold text-slate-800">
                    {fichaEmpresaModal.responsavel || 'Não informado'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> Telefone / WhatsApp
                  </span>
                  <span className="font-semibold text-slate-800">
                    {fichaEmpresaModal.telefone || 'Não informado'}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block">E-mail Corporativo</span>
                  <span className="font-semibold text-slate-800">
                    {fichaEmpresaModal.email || 'Não informado'}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Endereço / Cidade
                  </span>
                  <span className="font-semibold text-slate-800">
                    {[fichaEmpresaModal.endereco, fichaEmpresaModal.cidade]
                      .filter(Boolean)
                      .join(' — ') || 'Não informado'}
                  </span>
                </div>
                {fichaEmpresaModal.observacoes && (
                  <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                    <span className="text-slate-400 block">Observações</span>
                    <p className="text-slate-700 mt-0.5">{fichaEmpresaModal.observacoes}</p>
                  </div>
                )}
              </div>

              {/* Empreendimentos Vinculados */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Empreendimentos Vinculados
                </h4>
                {empreendimentos.filter((o) => o.empresaId === fichaEmpresaModal.id).length ===
                0 ? (
                  <p className="text-xs text-slate-400">Nenhum empreendimento cadastrado.</p>
                ) : (
                  <div className="space-y-1.5">
                    {empreendimentos
                      .filter((o) => o.empresaId === fichaEmpresaModal.id)
                      .map((obra) => (
                        <div
                          key={obra.id}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 text-xs"
                        >
                          <span className="font-semibold text-slate-800">{obra.nomeObra}</span>
                          <span className="text-slate-500">
                            {obra.localizacao} • {obra.status}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Usuários Vinculados */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Usuários com Acesso ao Portal
                </h4>
                {usuarios.filter((u) => u.empresaId === fichaEmpresaModal.id).length === 0 ? (
                  <p className="text-xs text-slate-400">Nenhum usuário cadastrado.</p>
                ) : (
                  <div className="space-y-1.5">
                    {usuarios
                      .filter((u) => u.empresaId === fichaEmpresaModal.id)
                      .map((usr) => (
                        <div
                          key={usr.id}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">{usr.nome}</span>
                            <span className="text-slate-500 ml-2 font-mono">{usr.email}</span>
                          </div>
                          <span className="text-slate-500">
                            {formatarDataExpiracao(usr.expiraEm)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => {
                    const emp = fichaEmpresaModal;
                    setFichaEmpresaModal(null);
                    abrirEdicaoEmpresa(emp);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  Editar Dados
                </button>
                <button
                  onClick={() => setFichaEmpresaModal(null)}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE PERMISSÕES E PRAZO */}
      {editUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Permissões & Prazo de Acesso</h3>
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
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Validade Atual: {formatarDataExpiracao(editUserModal.expiraEm)}
                </label>
                <select
                  value={editPrazoModo}
                  onChange={(e) => setEditPrazoModo(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  <option value="MANTER">Manter prazo atual</option>
                  <option value="PERMANENTE">Tornar Permanente (Sem expiração)</option>
                  <option value="30">Renovar por +30 dias a partir de hoje</option>
                  <option value="60">Renovar por +60 dias a partir de hoje</option>
                  <option value="90">Renovar por +90 dias (3 meses) a partir de hoje</option>
                  <option value="CUSTOM">Definir nova data específica...</option>
                </select>
                {editPrazoModo === 'CUSTOM' && (
                  <input
                    type="date"
                    value={editDataCustom}
                    onChange={(e) => setEditDataCustom(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                )}
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  checked={editAcessoTotal === true}
                  onChange={() => setEditAcessoTotal(true)}
                  className="mt-1 text-blue-600"
                />
                <span className="text-xs font-bold text-slate-900">
                  Acesso Total (Todos os Empreendimentos)
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  checked={editAcessoTotal === false}
                  onChange={() => setEditAcessoTotal(false)}
                  className="mt-1 text-blue-600"
                />
                <span className="text-xs font-bold text-slate-900">
                  Acesso Restrito (Selecionar Obras)
                </span>
              </label>

              {!editAcessoTotal && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 max-h-40 overflow-y-auto">
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
                  {salvandoPermissoes ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   PAINEL DO CLIENTE (SIDEBAR LATERAL COM ITENS = PROJETOS E SUBITENS = DISCIPLINAS)
============================================================================ */
function ClientDashboard({ userProfile, onLogout }) {
  const [empreendimentos, setEmpreendimentos] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState('TODOS');
  const [selectedDisc, setSelectedDisc] = useState('TODAS');
  const [expandedEmps, setExpandedEmps] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

        if (userProfile.acessoTotal !== true) {
          const permitidos = userProfile.empreendimentosPermitidos || [];
          listaEmps = listaEmps.filter((emp) => permitidos.includes(emp.id));
        }
        listaEmps.sort((a, b) => a.nomeObra.localeCompare(b.nomeObra, 'pt-BR'));
        setEmpreendimentos(listaEmps);

        if (listaEmps.length > 0) {
          setExpandedEmps({ [listaEmps[0].id]: true });
        }

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

  const toggleExpandEmp = (empId) => {
    setExpandedEmps((prev) => ({
      ...prev,
      [empId]: !prev[empId],
    }));
  };

  const selecionarTodosProjetos = () => {
    setSelectedEmp('TODOS');
    setSelectedDisc('TODAS');
    setMobileMenuOpen(false);
  };

  const selecionarEmpreendimento = (empId) => {
    setSelectedEmp(empId);
    setSelectedDisc('TODAS');
    setExpandedEmps((prev) => ({ ...prev, [empId]: true }));
    setMobileMenuOpen(false);
  };

  const selecionarDisciplina = (empId, discNome) => {
    setSelectedEmp(empId);
    setSelectedDisc(discNome);
    setMobileMenuOpen(false);
  };

  const arquivosVisiveis = arquivos.filter((arq) => {
    const matchEmp = selectedEmp === 'TODOS' || arq.empreendimentoId === selectedEmp;
    const matchDisc = selectedDisc === 'TODAS' || arq.disciplina === selectedDisc;
    const matchBusca =
      arq.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      arq.disciplina.toLowerCase().includes(busca.toLowerCase()) ||
      arq.nomeArquivo.toLowerCase().includes(busca.toLowerCase());
    return matchEmp && matchDisc && matchBusca;
  });

  const empAtualObj = empreendimentos.find((e) => e.id === selectedEmp);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 z-30 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-72 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <GrupoPrecisionLogo size="md" showText={true} />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-4">
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Acervo Técnico
            </p>

            <button
              onClick={selecionarTodosProjetos}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                selectedEmp === 'TODOS'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 shrink-0" />
                <span>Todos os Projetos</span>
              </span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  selectedEmp === 'TODOS' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {arquivos.length}
              </span>
            </button>
          </div>

          <div className="space-y-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Empreendimentos ({empreendimentos.length})
            </p>

            {empreendimentos.map((emp) => {
              const arqsDoEmp = arquivos.filter((a) => a.empreendimentoId === emp.id);
              const disciplinasDoEmp = [...new Set(arqsDoEmp.map((a) => a.disciplina))].sort(
                (a, b) => a.localeCompare(b, 'pt-BR')
              );
              const isExpanded = !!expandedEmps[emp.id];
              const isEmpSelected = selectedEmp === emp.id && selectedDisc === 'TODAS';

              return (
                <div key={emp.id} className="space-y-1">
                  <div
                    className={`flex items-center rounded-xl transition ${
                      isEmpSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : selectedEmp === emp.id
                        ? 'bg-slate-800/90 text-white'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <button
                      onClick={() => toggleExpandEmp(emp.id)}
                      className="p-2.5 text-slate-400 hover:text-white shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => selecionarEmpreendimento(emp.id)}
                      className="flex-1 flex items-center justify-between py-2.5 pr-3 text-left text-sm font-medium min-w-0"
                    >
                      <span className="flex items-center gap-2 truncate">
                        {isExpanded ? (
                          <FolderOpen className="w-4 h-4 shrink-0 text-blue-400" />
                        ) : (
                          <Folder className="w-4 h-4 shrink-0 text-slate-400" />
                        )}
                        <span className="truncate">{emp.nomeObra}</span>
                      </span>
                      <span
                        className={`ml-2 text-[11px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${
                          isEmpSelected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {arqsDoEmp.length}
                      </span>
                    </button>
                  </div>

                  {isExpanded && disciplinasDoEmp.length > 0 && (
                    <div className="ml-5 pl-3 border-l border-slate-700/80 space-y-0.5 py-1">
                      {disciplinasDoEmp.map((discNome) => {
                        const qtdDisc = arqsDoEmp.filter((a) => a.disciplina === discNome).length;
                        const isDiscSelected =
                          selectedEmp === emp.id && selectedDisc === discNome;

                        return (
                          <button
                            key={discNome}
                            onClick={() => selecionarDisciplina(emp.id, discNome)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                              isDiscSelected
                                ? 'bg-blue-600/90 text-white font-semibold'
                                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                            }`}
                          >
                            <span className="truncate">{discNome}</span>
                            <span className="ml-2 text-[10px] opacity-80 shrink-0">{qtdDisc}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/40 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{userProfile.empresa}</p>
              <p className="text-[11px] text-slate-400 truncate">
                {userProfile.nome} {userProfile.cargo ? `• ${userProfile.cargo}` : ''}
              </p>
            </div>
            <button
              onClick={onLogout}
              title="Sair do portal"
              className="p-2 rounded-lg bg-slate-800 hover:bg-red-600/20 hover:text-red-400 text-slate-300 border border-slate-700 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {userProfile.expiraEm && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-900">
            <Clock className="w-3.5 h-3.5 inline mr-1.5 text-amber-700" />
            Acesso temporário válido até{' '}
            <strong>{formatarDataExpiracao(userProfile.expiraEm)}</strong>. Salve uma cópia local dos arquivos.
          </div>
        )}

        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 text-sm truncate">
              <button
                onClick={selecionarTodosProjetos}
                className="text-slate-400 hover:text-blue-600 transition shrink-0"
              >
                Projetos
              </button>

              {empAtualObj && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  <button
                    onClick={() => selecionarEmpreendimento(empAtualObj.id)}
                    className={`truncate ${
                      selectedDisc === 'TODAS'
                        ? 'font-bold text-slate-900'
                        : 'text-slate-500 hover:text-blue-600'
                    }`}
                  >
                    {empAtualObj.nomeObra}
                  </button>
                </>
              )}

              {selectedDisc !== 'TODAS' && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  <span className="font-bold text-blue-600 truncate">{selectedDisc}</span>
                </>
              )}

              {!empAtualObj && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  <span className="font-bold text-slate-900">Todos os Empreendimentos</span>
                </>
              )}
            </div>
          </div>

          <span className="hidden sm:inline-block text-xs font-semibold text-slate-400 shrink-0">
            {arquivosVisiveis.length} arquivo(s)
          </span>
        </header>

        <main className="p-4 sm:p-8 max-w-6xl w-full mx-auto flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {selectedDisc !== 'TODAS'
                  ? selectedDisc
                  : empAtualObj
                  ? empAtualObj.nomeObra
                  : 'Central de Projetos e Entregas Técnicas'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {empAtualObj?.localizacao
                  ? `${empAtualObj.localizacao} • `
                  : 'Grupo Precision • '}
                Clique em "Baixar Arquivo" para obter a versão técnica oficial.
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar documento, prancha, DWG..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500">Carregando seus projetos...</div>
          ) : arquivosVisiveis.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-2">
              <HardDrive className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Nenhum arquivo encontrado</p>
              <p className="text-xs text-slate-500">
                Selecione outro empreendimento ou disciplina no menu lateral esquerdo.
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
      </div>
    </div>
  );
}
