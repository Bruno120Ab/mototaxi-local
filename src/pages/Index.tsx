import { useEffect, useState } from "react";
import { Bike, Car, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MototaxistaCard } from "@/components/MototaxistaCard";
import { SolicitarForm } from "@/components/SolicitarForm";
import { ConfirmacaoSolicitacao } from "@/components/ConfirmacaoSolicitacao";
import { ConfirmarRepetirViagem } from "@/components/ConfirmarRepetirViagem";
import { FavoritosSection } from "@/components/FavoritosSection";
import { HistoricoSection } from "@/components/HistoricoSection";
import { DetalhesMotoboyModal } from "@/components/DetalhesMotoboyModal";
import { ConfiguracoesModal } from "@/components/ConfiguracoesModal";
import { useMototaxistas } from "@/hooks/useMototaxistas";
import { useConfiguracoes } from "@/hooks/useConfiguracoes";
import { useSolicitacoes } from "@/hooks/useSolicitacoes";
import { useFavoritos } from "@/hooks/useFavoritos";
import { useHistorico } from "@/hooks/useHistorico";
import { useEnderecosPadrao } from "@/hooks/useEnderecosPadrao";
import { useAvaliacoes } from "@/hooks/useAvaliacoes";
import { Mototaxista, Solicitacao } from "@/types/mototaxi";
import { useToast } from "@/hooks/use-toast";
import { AddToHomeScreenCarousel } from "@/components/AddToWarn";
import usePWAInstall from "@/hooks/usePWAInstall";
import InstallPWAButton from "@/components/InstallPWAButton";
import { BannerSection } from "@/components/Banners";

type TelaTipo = 'inicial' | 'solicitar' | 'confirmacao' | 'gerenciar' | 'selecionar-mototaxista';

export function NotificacaoPermissao() {
  const [permStatus, setPermStatus] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermStatus(Notification.permission);
    }
  }, []);

  const pedirPermissao = () => {
    if (!("Notification" in window)) {
      alert("Este navegador não suporta notificações.");
      return;
    }

    if (permStatus === "granted") {
      alert("Permissão já concedida!");
      return;
    }

    if (permStatus === "denied") {
      alert(
        "Você negou a permissão. Para receber notificações, revogue a permissão manualmente nas configurações do navegador e tente novamente."
      );
      return;
    }

    // permStatus === 'default'
    Notification.requestPermission().then((permission) => {
      setPermStatus(permission);
      if (permission === "granted") {
        alert("Permissão concedida!");
      } else {
        alert("Permissão negada ou não concedida.");
      }
    });
  };

  return (
    <div className="space-y-2">
      <p>Status atual da permissão: <strong>{permStatus}</strong></p>
      <Button onClick={pedirPermissao} variant="outline">
        {permStatus === "granted" ? "Permissão concedida" : "Pedir permissão de notificação"}
      </Button>
      {permStatus === "denied" && (
        <p className="text-sm text-red-600">
          Para alterar, vá nas configurações do navegador e revogue a permissão.
        </p>
      )}
    </div>
  );
}
const Index = () => {
  const [telaAtual, setTelaAtual] = useState<TelaTipo>('inicial');
  const [ultimaSolicitacao, setUltimaSolicitacao] = useState<Solicitacao | null>(null);
  const [mototaxistaSelecionado, setMototaxistaSelecionado] = useState<Mototaxista | null>(null);
  const [viagemParaRepetir, setViagemParaRepetir] = useState<Solicitacao | null>(null);
  const [mostrarConfirmacaoRepeticao, setMostrarConfirmacaoRepeticao] = useState(false);
  const [motoboyDetalhes, setMotoboyDetalhes] = useState<Mototaxista | null>(null);
  const [mostrarDetalhesModal, setMostrarDetalhesModal] = useState(false);
  const [mostrarConfiguracoesModal, setMostrarConfiguracoesModal] = useState(false);
  const { mototaxistasAtivos, quantidadeAtivos, mototaxistas, toggleStatus } = useMototaxistas();
  const { adicionarSolicitacao } = useSolicitacoes();
  const { favoritos, adicionarFavorito, removerFavorito, isFavorito } = useFavoritos();
  const { historico, adicionarViagem, adicionarAvaliacao, obterAvaliacao } = useHistorico();
  const { enderecos } = useEnderecosPadrao();
  const { toast } = useToast();
  const { calcularMetricasMotorista, adicionarAvaliacao: adicionarAvaliacaoReativa } = useAvaliacoes();
  const { configuracao } = useConfiguracoes();

  const handleSolicitar = (dadosSolicitacao: Omit<Solicitacao, 'id'>) => {
    const solicitacao = adicionarSolicitacao(dadosSolicitacao);
    setUltimaSolicitacao(solicitacao);
    adicionarViagem(solicitacao);
    setTelaAtual('confirmacao');
    
    toast({
      title: "Solicitação Completa!",
      description: "Agora envie seu pedido.",
    });
  };

  const handleSelecionarMototaxista = (mototaxista: Mototaxista) => {
    setMototaxistaSelecionado(mototaxista);
    localStorage.setItem("mototaxista", JSON.stringify(mototaxista));
    setTelaAtual('solicitar');
  };

  const handleSelecionarFavorito = (mototaxista: Mototaxista) => {
    handleSelecionarMototaxista(mototaxista);
  };

  const handleMostrarDetalhes = (mototaxista: Mototaxista) => {
    setMotoboyDetalhes(mototaxista);
    setMostrarDetalhesModal(true);
  };

  const handleReutilizarViagem = (viagem: Solicitacao) => {
    setViagemParaRepetir(viagem);
    setMostrarConfirmacaoRepeticao(true);
  };

  const handleConfirmarRepeticaoViagem = (novaViagem: Solicitacao) => {
    const solicitacao = adicionarSolicitacao(novaViagem);
    setUltimaSolicitacao(solicitacao);
    adicionarViagem(solicitacao);
    setTelaAtual('confirmacao');
    
    toast({
      title: "Viagem repetida!",
      description: "Agora envie seu pedido.",
    });
  };

  const handleToggleFavorito = (mototaxista: Mototaxista) => {
    if (isFavorito(mototaxista.id)) {
      removerFavorito(mototaxista.id);
      toast({
        title: "Removido dos favoritos",
        description: `${mototaxista.nome} foi removido dos seus favoritos.`,
      });
    } else {
      const sucesso = adicionarFavorito(mototaxista);
      if (sucesso) {
        toast({
          title: "Adicionado aos favoritos",
          description: `${mototaxista.nome} foi adicionado aos seus favoritos.`,
        });
      } else {
        toast({
          title: "Limite atingido",
          description: "Você pode ter no máximo 3 motoboys favoritos.",
          variant: "destructive"
        });
      }
    }
  };

  const enviarWhatsApp = () => {
  if (!ultimaSolicitacao) return;

  // Pega o mototaxista salvo no localStorage
  const dadosMototaxista = localStorage.getItem("mototaxista");
  let telefone = "71999099688"; // fallback padrão

  if (dadosMototaxista) {
    try {
      const mototaxista = JSON.parse(dadosMototaxista);
      if (mototaxista.telefone) {
        // Remove qualquer caractere não numérico e adiciona DDI +55
        telefone = mototaxista.telefone.replace(/\D/g, "");
        if (!telefone.startsWith("55")) {
          telefone = "55" + telefone;
        }
      }
    } catch (error) {
      console.error("Erro ao ler telefone do mototaxista no localStorage", error);
    }
  }

  let mensagem = `🚕 *NOVA SOLICITAÇÃO DE MOTO-TÁXI*\n\n`;
  mensagem += `👤 *Cliente:* ${ultimaSolicitacao.nome}\n`;
  mensagem += `📍 *Origem:* ${ultimaSolicitacao.endereco}\n`;

  if (ultimaSolicitacao.destino) {
    mensagem += `🎯 *Destino:* ${ultimaSolicitacao.destino}\n`;
  }

  if (ultimaSolicitacao.coordenadasOrigem) {
    const { lat, lng } = ultimaSolicitacao.coordenadasOrigem;
    mensagem += `📱 *Link Origem:* https://maps.google.com/?q=${lat},${lng}\n`;
  }

  if (ultimaSolicitacao.isAgendamento) {
    mensagem += `*Tipo de viagem: Agendadada*`;
  }

  mensagem += `\n⏰ *Horário:* ${ultimaSolicitacao.dataHora.toLocaleString('pt-BR')}\n`;
  mensagem += `\n*Favor confirmar se pode atender! 🙏*`;

  const url = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;

  window.open(url, "_blank");
};

  const renderTela = () => {
    switch (telaAtual) {
      case 'solicitar':
        return (
          <SolicitarForm
            onSolicitar={handleSolicitar}
            onCancel={() => setTelaAtual('inicial')}
            mototaxistaSelecionado={mototaxistaSelecionado}
            enderecosPadrao={enderecos}
          />
        );

      case 'selecionar-mototaxista':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Selecionar Mototaxista</h2>
              <Button 
                variant="outline" 
                onClick={() => setTelaAtual('inicial')}
              >
                Voltar
              </Button>
            </div>
            
            <div className="space-y-3">
              {mototaxistasAtivos.map((mototaxista) => {
                const metricas = calcularMetricasMotorista(mototaxista.nome, historico);
                return (
                  <MototaxistaCard
                    key={mototaxista.id}
                    mototaxista={mototaxista}
                    onToggleStatus={toggleStatus}
                    onSelecionar={handleMostrarDetalhes}
                    isFavorito={isFavorito(mototaxista.id)}
                    onToggleFavorito={handleToggleFavorito}
                    showFavoriteButton={true}
                    metricas={metricas}
                  />
                );
              })}
            </div>
          </div>
        );
      
      case 'confirmacao':
        return ultimaSolicitacao ? (
          <ConfirmacaoSolicitacao
            solicitacao={ultimaSolicitacao}
            onVoltarInicio={() => setTelaAtual('inicial')}
            onEnviarWhatsApp={enviarWhatsApp}
          />
        ) : null;
      
      case 'gerenciar':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Gerenciar Mototaxistas</h2>
              <Button 
                variant="outline" 
                onClick={() => setTelaAtual('inicial')}
              >
                Voltar
              </Button>
            </div>
            
            <div className="space-y-3">
              {mototaxistas.map((mototaxista) => (
                <MototaxistaCard
                  key={mototaxista.id}
                  mototaxista={mototaxista}
                  onToggleStatus={toggleStatus}
                  showToggle={true}
                />
              ))}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-between">
                <div></div>
                <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
                  <Bike className="h-8 w-8 text-primary" />
                  Moto-Táxi de Itambé
                </h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMostrarConfiguracoesModal(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-muted-foreground">
                Seu táxi na palma da mão, Você no controle da corrida.             
              </p>
              <InstallPWAButton />
              <NotificacaoPermissao />

            </div>

            {/* Seção de Favoritos */}
            <FavoritosSection 
              favoritos={favoritos} 
              onSelecionarFavorito={handleSelecionarFavorito}
              onRemoverFavorito={removerFavorito}
            />

            {/* Seção de Histórico */}
            <HistoricoSection 
              historico={historico}
              onReutilizarViagem={handleReutilizarViagem}
              onSalvarAvaliacao={adicionarAvaliacaoReativa}
              obterAvaliacao={obterAvaliacao}
            />

            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Mototaxistas Disponíveis 
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mototaxistasAtivos.slice(0, 3).map((mototaxista) => {
                    const metricas = calcularMetricasMotorista(mototaxista.nome, historico);
                    return (
                      <MototaxistaCard
                        key={mototaxista.id}
                        mototaxista={mototaxista}
                        onToggleStatus={toggleStatus}
                        onSelecionar={handleMostrarDetalhes}
                        isFavorito={isFavorito(mototaxista.id)}
                        onToggleFavorito={handleToggleFavorito}
                        showFavoriteButton={true}
                        metricas={metricas}
                      />
                    );
                  })}
                  {quantidadeAtivos  > 2 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setTelaAtual('selecionar-mototaxista')}
                    >
                      Ver todos motoboys do app ({quantidadeAtivos} disponíveis)
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Botões de ação */}
            <div className="space-y-3">
              <Button
                onClick={() => setTelaAtual('selecionar-mototaxista')}
                disabled={quantidadeAtivos === 0}
                className="w-full h-14 text-lg"
                size="lg"
              >
              <Car className="h-5 w-5 mr-2" />
                Solicitar Moto-Táxi
              </Button>
            </div>

           

            <div className="flex flex-col items-center mr-top-10 justify-center space-y-3 mx-auto">
              <img src="/caminho/para/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
              <h1 className="text-sm text-center">
              Desenvolvedor: Bruno Abreu
              </h1>
              <h1 className="text-sm text-center">
              Contato: brunoabreudevs@gmail.com
              </h1>
            </div>

            <BannerSection/>

          </div>
        );
    }
  };

  return (
   <div className="min-h-screen bg-background p-4">
    <div className="max-w-md mx-auto">
      {renderTela()}
    </div>
    {/* <AddToHomeScreenCarousel /> */}
    
    <ConfirmarRepetirViagem
      viagem={viagemParaRepetir}
      isOpen={mostrarConfirmacaoRepeticao}
      onClose={() => {
        setMostrarConfirmacaoRepeticao(false);
        setViagemParaRepetir(null);
      }}
      onConfirmar={handleConfirmarRepeticaoViagem}
    />

    <DetalhesMotoboyModal
      mototaxista={motoboyDetalhes}
      isOpen={mostrarDetalhesModal}
      onClose={() => {
        setMostrarDetalhesModal(false);
        setMotoboyDetalhes(null);
      }}
      onSelecionar={handleSelecionarMototaxista}
      metricas={motoboyDetalhes ? calcularMetricasMotorista(motoboyDetalhes.nome, historico) : undefined}
    />

    <ConfiguracoesModal
      isOpen={mostrarConfiguracoesModal}
      onClose={() => setMostrarConfiguracoesModal(false)}
    />
  </div>
  );
};

export default Index;
