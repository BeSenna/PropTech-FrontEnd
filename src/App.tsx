import { Navigate, Route, Routes } from 'react-router-dom';
import { PortalLayout, RequireRole, SindicoLayout } from './pages/Layouts';
import Login from './pages/Login';
import { CadastrosOverview, Dashboard, FinanceiroOverview, ServicosOverview } from './pages/Overviews';
import ResourceList from './pages/ResourceList';
import ResourceForm from './pages/ResourceForm';
import ResourceDetail from './pages/ResourceDetail';
import { PortalAvisos, PortalCobranca, PortalCobrancas, PortalHome, PortalImovel, PortalNovaOcorrencia, PortalNovaReserva, PortalOcorrencias, PortalReservas } from './pages/Portal';
import type { ResourceConfig } from './lib/types';
import { blocoCfg, imovelCfg, moradorCfg, usuarioCfg, vinculoCfg } from './resources/moradores';
import { areaCfg, avisoCfg, cobrancaCfg, despesaCfg, manutencaoCfg, ocorrenciaCfg, pagamentoCfg, receitaCfg, reservaCfg } from './resources/simulados';

const RESOURCES: ResourceConfig[] = [blocoCfg, imovelCfg, moradorCfg, vinculoCfg, usuarioCfg, cobrancaCfg, pagamentoCfg, despesaCfg, receitaCfg, areaCfg, reservaCfg, ocorrenciaCfg, manutencaoCfg, avisoCfg];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RequireRole role="SINDICO" />}>
        <Route element={<SindicoLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="cadastros" element={<CadastrosOverview />} />
          <Route path="financeiro" element={<FinanceiroOverview />} />
          <Route path="servicos" element={<ServicosOverview />} />
          {RESOURCES.map((cfg) => (
            <Route key={cfg.key} path={cfg.path.slice(1)}>
              <Route index element={<ResourceList cfg={cfg} />} />
              <Route path="novo" element={<ResourceForm cfg={cfg} mode="create" />} />
              {cfg.hasDetail && <Route path=":id" element={<ResourceDetail cfg={cfg} />} />}
              <Route path=":id/editar" element={<ResourceForm cfg={cfg} mode="edit" />} />
            </Route>
          ))}
        </Route>
      </Route>

      <Route element={<RequireRole role="MORADOR" />}>
        <Route path="portal" element={<PortalLayout />}>
          <Route index element={<PortalHome />} />
          <Route path="imovel" element={<PortalImovel />} />
          <Route path="reservas" element={<PortalReservas />} />
          <Route path="reservas/nova" element={<PortalNovaReserva />} />
          <Route path="ocorrencias" element={<PortalOcorrencias />} />
          <Route path="ocorrencias/nova" element={<PortalNovaOcorrencia />} />
          <Route path="avisos" element={<PortalAvisos />} />
          <Route path="cobrancas" element={<PortalCobrancas />} />
          <Route path="cobrancas/:id" element={<PortalCobranca />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
