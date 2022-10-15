use std::sync::mpsc;

use discord_rich_presence::{DiscordIpcClient, DiscordIpc, activity::Activity};

fn main() {
    let (tx, rx) = mpsc::channel();

    ctrlc::set_handler(move || tx.send(()).expect("Could not send signal on channel."))
        .expect("Error setting Ctrl-C handler");

    main_unchecked().expect("Main proccess error");

    println!("Waiting for Ctrl-C...");
    rx.recv().expect("Could not receive from channel.");
    println!("Got it! Exiting...");
}

fn main_unchecked() -> Result<(), Box<dyn std::error::Error>> {
    let mut client = DiscordIpcClient::new("<id>")?;

    client.connect()?;
    client.set_activity(Activity::new()
        .state("foo")
        .details("bar")
    )?;

    Ok(())
}