from sqlmodel import Session, select
from app.database import engine
from app.leads.model import Lead
from app.mensajes.model import Mensaje
from app.config.model import BotConfig
from app.company_info.model import CompanyInfo


def run_seed():
    with Session(engine) as session:

        # BotConfig
        existing = session.exec(select(BotConfig)).first()
        if not existing:
            session.add(BotConfig(
                nombre_empresa="Aislaciones RH",
                encargado_numero="",
                horas_seguimiento=24,
                max_seguimientos=1,
                mensaje_seguimiento="Hola {nombre}, te escribimos desde {empresa}. ¿Pudiste ver la info que te enviamos? Quedamos a disposición 🙌",
                server_url="https://agente-evolution-api.ltze9b.easypanel.host",
                instance_name="Bot",
                apikey="",
                bot_activo=True,
            ))
            print("✓ BotConfig insertada")
        else:
            print("→ BotConfig ya existe")

        # CompanyInfo
        existing_info = session.exec(select(CompanyInfo)).first()
        if not existing_info:
            for entrada in [
                CompanyInfo(pregunta="¿Qué servicios ofrecen?",
                            respuesta="Aislaciones térmicas y acústicas para todo tipo de inmuebles residenciales y comerciales en Mendoza.",
                            orden=1),
                CompanyInfo(pregunta="¿En qué zonas trabajan?",
                            respuesta="En toda la provincia de Mendoza y alrededores.",
                            orden=2),
                CompanyInfo(pregunta="¿Cómo solicito un presupuesto?",
                            respuesta="Respondé este chat con los datos de tu inmueble: tipo, zona y superficie aproximada.",
                            orden=3),
            ]:
                session.add(entrada)
            print("✓ CompanyInfo insertada con 3 entradas")
        else:
            print("→ CompanyInfo ya existe")

        session.commit()
        print("\n✅ Seed completado")


if __name__ == "__main__":
    run_seed()
